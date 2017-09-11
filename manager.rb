require 'mp3info'
require 'json'
require 'sinatra'
require 'sinatra/cross_origin'
require 'sinatra/json'
require 'open3'
require 'erb'
require 'pp'

MAX_PHRASE_LENGTH = 128
MAX_PHRASE_DURATION = 16
MIN_PHRASE_DURATION = 2
PHRASES_FILE = 'phrases.json'
MUSIC_PATH = File.absolute_path('audio')
MUTE_MUSIC_LOCK = File.join(MUSIC_PATH, 'mute_audio.lock')

class MirrorManager < Sinatra::Application

  set :bind, '0.0.0.0'

  before do
    response.headers['Access-Control-Allow-Origin'] = '*'
  end


  ### Static content route ###
  get '/' do
    send_file File.join(settings.public_folder, 'manager.html')
  end

  ### REST routes ###
  get '/phrases' do
    data = JSON.parse(File.read(PHRASES_FILE))

    data['phrases'].sort_by! { |phrase| phrase['text'].downcase }
    json data
  end

  post '/phrases' do
    now = Time.new
    phrase_data = { last_modified: now.to_s }

    payload = params
    payload = JSON.parse(request.body.read) unless params[:path]
    phrase_data['phrases'] = filter_phrase_data(payload['phrases'])

    json_text = JSON.pretty_generate(phrase_data)
    File.write(PHRASES_FILE, json_text)
    'OK'.to_json
  end

  get '/tracks' do
    track_list = []
    Dir.foreach(MUSIC_PATH) do |file|
      track = Track.new(file)
      if track.file?
        track_list << { file: track.basename, metadata: track.metadata }
      end
    end
    json track_list
  end

  post '/tracks' do
    track = Track.new(params[:file][:filename], params[:file])
    error track.error, track.error_message unless track.upload_valid?

    File.open(track.absolute_path, 'wb') do |f|
      f.write(track.tempfile.read)
    end

    content_type :json
    { file: track.basename, metadata: track.metadata }.to_json

  end

  delete '/tracks/:filename' do
    track = Track.new(params[:filename])
    File.delete(track.absolute_path)
    'OK'.to_json
  end

  get '/config' do
    config = {}
    config[:muted] = File.exist?(MUTE_MUSIC_LOCK)
    config[:wifi] = Wifi.status
    config.to_json
  end

  get'/config/music' do
    # True: muted
    # False: unmuted
    File.exist?(MUTE_MUSIC_LOCK).to_json
  end

  put'/config/music/:state' do
    if params['state'].downcase == 'on'
      File.delete(MUTE_MUSIC_LOCK) if File.exist?(MUTE_MUSIC_LOCK)
    else
      FileUtils.touch(MUTE_MUSIC_LOCK)
    end
    'OK'.to_json
  end

  # https://www.raspberrypi.org/documentation/configuration/wireless/wireless-cli.md
  # wpa_cli reconfigure
  # https://github.com/radiodan-archive/wpa-cli-ruby/blob/master/lib/wpa_cli_ruby/wpa_cli_wrapper.rb
  get'/config/wifi/network' do
    status = Wifi.status
    status.to_json
  end

  post'/config/wifi/network' do
    payload = params
    payload = JSON.parse(request.body.read) unless params[:path]
    pp payload
    if payload['ssid'].empty? || payload['password'].empty?
      error 400, 'SSID and password required'
    end
    # TODO: handle the FAIL case from the reconfigure command
    # ie the password is too short, etc
    # revert the changes to the file by using
    # wpa_cli save_config (?)
    result = Wifi.new().reconfigure(payload['ssid'], payload['password'])
    unless result
      error 400, 'password too short?'
    else
      'OK'.to_json
    end

  end


  ### END ROUTES ###

  # TODO: Manage mirror configuration (ie disable audio entirely)
  # TODO: Allow setting wifi params (name and password)

  error 401 do
    'Error 401 - Authentication required'
  end

  options '*' do
    response.headers['Allow'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Accept, X-User-Email, X-Auth-Token'
    response.headers['Access-Control-Allow-Origin'] = '*'
    200
  end

  def filter_phrase_data(phrase_data)
    filtered_data = []
    phrase_data.each do |phrase|
      next if phrase['text'].empty?

      duration = phrase['duration'].to_i
      duration = MIN_PHRASE_DURATION if duration < MIN_PHRASE_DURATION
      duration = MAX_PHRASE_DURATION if duration > MAX_PHRASE_DURATION
      phrase['text'] = phrase['text'][0..MAX_PHRASE_LENGTH] if phrase['text'].length > MAX_PHRASE_LENGTH

      filtered_data << { text: phrase['text'], duration: duration }
    end

    filtered_data
  end

end

class Mp3Info
  def to_json(*a)
    hash = { json_class: self.class.name }
    instance_variables.each { |var| hash[var.to_s.delete('@')] = instance_variable_get(var) }
    hash.to_json(*a)
  end
end

class Wifi
  @@wpa_cli = '/sbin/wpa_cli'

  attr_reader :ssid
  attr_reader :psk

  def initialize
    @ssid = nil
    @psk = nil
  end

  def self.status
    status = Hash.new()
    stdout, stderr, exit_status = Open3.capture3(@@wpa_cli, 'status')
    stdout.each_line do |line|
      line.chomp!
      (key, value) = line.split('=', 2)
      status[key] = value
    end
    return status
  end

  def reconfigure(ssid, psk)
    @ssid = ssid
    @psk = psk
    template = File.read('templates/wpa_supplicant.conf.erb')
    renderer = ERB.new(template, nil, '-')
    File.write('/etc/wpa_supplicant/wpa_supplicant.conf', renderer.result(binding))
    # puts output = renderer.result(binding)
    stdout, stderr, exit_status = Open3.capture3(@@wpa_cli, 'reconfigure')
    result = stdout.split("\n")[1]
    return result == 'OK'

  end
end

class Track

  @filename = nil
  @upload = nil
  @error = nil
  @error_message = nil

  attr_reader :error
  attr_reader :error_message

  def initialize(filename, upload = nil)
    @filename = File.basename(filename.gsub(/[^\w.]/, '_'))
    @upload = upload
  end

  def upload_valid?
    if @upload[:type] != 'audio/mpeg'
      _set_error(415, 'Invalid file type')
    elsif File.exist?(absolute_path)
      _set_error(409, 'File exists')
    end

    error.nil?
  end

  def metadata
    Mp3Info.open(tempfile || absolute_path) do |mp3info|
      return mp3info
    end
  end

  def absolute_path
    [MUSIC_PATH, @filename].join(File::SEPARATOR)
  end

  def basename
    File.basename(absolute_path)
  end

  def file?
    File.file?(absolute_path)
  end

  def tempfile
    if @upload.nil?
      nil
    else
      @upload[:tempfile]
    end
  end

  def _set_error(code, message)
    @error = code
    @error_message = message
  end

end