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
    track_list=[]
    Dir.foreach(MUSIC_PATH) do |file|
      file = [MUSIC_PATH, file].join(File::SEPARATOR)
      if File.file?(file)
        track_list << { file: File.basename(file), metadata: track_info(file) }
      end
    end
    json track_list
  end

  post '/tracks' do
    file = params['file']
    check = track_valid?(file)
    pp check.class
    error check[:error], check[:message] if check.is_a?(Hash)

  end

  delete '/tracks/:filename' do
    filename = [MUSIC_PATH, File.basename(params['filename'])].join(File::SEPARATOR)
    File.delete(filename)
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
      next if phrase['text'].length == 0

      duration = phrase['duration'].to_i
      duration = MIN_PHRASE_DURATION if duration < MIN_PHRASE_DURATION
      duration = MAX_PHRASE_DURATION if duration > MAX_PHRASE_DURATION
      phrase['text'] = phrase['text'][0..MAX_PHRASE_LENGTH] if phrase['text'].length > MAX_PHRASE_LENGTH

      filtered_data << { text: phrase['text'], duration: duration }
    end

    filtered_data

  end

  def track_info(file)
    Mp3Info.open(file) do |mp3info|
      pp mp3info
      return mp3info
    end
  end

  def track_valid?(file)
    return { error: 415, message: 'Invalid file type' } unless file['type'] == 'audio/mpeg'
    return { error: 409, message: 'File exists' } if File.exist?([MUSIC_PATH, file['filename']].join(File::SEPARATOR))

    # Grab the metadata only after we know we have an mp3 file
    metadata = track_info(file[:tempfile])
    return { error: 415, message: "Sample rate 44100 required. Got #{metadata.samplerate}" } unless metadata.samplerate == 44100

    true
  end

end

class Mp3Info
  def to_json(*a)
    hash = { json_class: self.class.name }
    self.instance_variables.each {|var| hash[var.to_s.delete('@')] = self.instance_variable_get(var)}
    hash.to_json(*a)
  end
end