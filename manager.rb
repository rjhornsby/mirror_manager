require 'json'
require 'sinatra'
require 'sinatra/cross_origin'
require 'sinatra/json'
require 'pp'

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
    json_data = Hash.new
    json_data['last_modified'] = now.to_s
    payload = params
    payload = JSON.parse(request.body.read) unless params[:path]
    json_data['phrases'] = payload['phrases']
    json_text = json_data.to_json
    # TODO: validate the input...
    File.write('phrases.json', json_text)
    'OK'.to_json
  end

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
end