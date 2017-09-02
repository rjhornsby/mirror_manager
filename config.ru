require 'rubygems'
require File.join(File.dirname(__FILE__), 'manager.rb')

require 'sinatra'
require 'multi_json'

class MirrorManager < Sinatra::Application
  configure do

    enable :cross_origin

    # Don't log them. We'll do that ourself
    set :dump_errors, false

    # Don't capture any errors. Throw them up the stack
    set :raise_errors, true

    # Disable internal middleware for presenting errors
    # as useful HTML pages
    set :show_exceptions, false
  end
end

class ExceptionHandling
  def initialize(app)
    @app = app
  end

  def call(env)
    begin
      @app.call env
    rescue => ex
      env['rack.errors'].puts ex
      env['rack.errors'].puts ex.backtrace.join("\n")
      env['rack.errors'].flush

      hash = { message: ex.to_s }
      # hash[:backtrace] = ex.backtrace

      [500, { 'Content-Type' => 'application/json' }, [MultiJson.dump(hash)]]
    end
  end
end

use ExceptionHandling

use Rack::Auth::Basic, 'Authentication required' do |username, password|
  username == 'admin' and password == 'mirror'
end

run MirrorManager