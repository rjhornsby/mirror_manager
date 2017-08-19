require 'json'
require 'sinatra'
require 'sinatra/cross_origin'
require 'sinatra/json'
require 'pp'

MAX_PHRASE_LENGTH = 128
MAX_PHRASE_DURATION = 16
MIN_PHRASE_DURATION = 2

class MirrorManager < Sinatra::Application

  before do
    response.headers['Access-Control-Allow-Origin'] = '*'
  end

  get '/' do
    send_file File.join(settings.public_folder, 'manager.html')
  end

  get '/phrases' do
    data = JSON.parse(File.read('phrases.json'))

    data['phrases'].sort_by! { |phrase| phrase['text'].downcase }
    json data
  end

  post '/phrases' do
    now = Time.new
    json_data = { 'last_modified': now.to_s }

    payload = params
    payload = JSON.parse(request.body.read) unless params[:path]
    json_data['phrases'] = filter_phrase_data(payload['phrases'])

    json_text = json_data.to_json
    File.write('phrases.json', json_text)
    'OK'.to_json
  end

  error 400..410 do
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

end