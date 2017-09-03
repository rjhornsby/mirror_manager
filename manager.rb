require 'mp3info'
require 'json'
require 'sinatra'
require 'sinatra/cross_origin'
require 'sinatra/json'
require 'pp'

MAX_PHRASE_LENGTH = 128
MAX_PHRASE_DURATION = 16
MIN_PHRASE_DURATION = 2
PHRASES_FILE = 'phrases.json'
MUSIC_PATH = File.absolute_path('audio')

class MirrorManager < Sinatra::Application

  before do
    response.headers['Access-Control-Allow-Origin'] = '*'
  end

  get '/' do
    send_file File.join(settings.public_folder, 'manager.html')
  end

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

  # TODO: Manage song library
  # TODO: Ensure the uploaded mp3 file format is correct, otherwise reject

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
    track = Track.new(params['file']['filename'], params['file'])
    # pp file
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

class Track

  @filename = nil
  @upload = nil
  @error = nil
  @error_message = nil

  attr_reader :tempfile
  attr_reader :error
  attr_reader :error_message

  def initialize(filename, upload = nil)
    @filename = File.basename(filename.gsub(/[^\w.]/, '_'))
    @upload = upload
  end

  def upload_valid?
    if @upload['type'] != 'audio/mpeg'
      _set_error(415, 'Invalid file type')
    elsif File.exist?(absolute_path)
      _set_error(409, 'File exists')
    elsif metadata.samplerate != 44_100
      _set_error(415, "Sample rate 44100 required. Got #{metadata.samplerate}")
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
      @upload['tempfile']
    end
  end

  def _set_error(code, message)
    @error = code
    @error_message = message
  end

end