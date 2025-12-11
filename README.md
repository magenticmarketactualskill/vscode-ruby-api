# VS Code Ruby API Extension

This VS Code extension enables bidirectional communication between VS Code and Ruby applications using the JSON-RPC-LD protocol.

## Features

- **Receive Commands from Ruby**: Ruby applications can control VS Code through the API
- **Send Events to Ruby**: VS Code events (file saves, editor changes) are sent to Ruby handlers
- **Multiple Connection Modes**: Supports local, Docker, and remote Ruby applications
- **Automatic Reconnection**: Automatically reconnects when connection is lost

## Requirements

- VS Code 1.85.0 or higher
- Ruby application with `vscode-api` gem installed and running

## Installation

1. Install the extension from the VS Code marketplace
2. Install the Ruby gem in your application:

```bash
gem install vscode-api
```

3. Configure the extension in VS Code settings

## Configuration

### Local Mode (Development)

For Ruby applications running on localhost:

```json
{
  "vscodeRubyApi.mode": "local",
  "vscodeRubyApi.local.port": 7658
}
```

### Docker Mode

For Ruby applications running in Docker:

```json
{
  "vscodeRubyApi.mode": "docker",
  "vscodeRubyApi.docker.host": "localhost",
  "vscodeRubyApi.docker.port": 7658
}
```

### Remote Mode

For Ruby applications running on a remote server:

```json
{
  "vscodeRubyApi.mode": "remote",
  "vscodeRubyApi.remote.url": "https://api.example.com",
  "vscodeRubyApi.remote.authType": "apiKey"
}
```

## Usage

### In Your Ruby Application

```ruby
require 'vscode-api'

# Configure the gem
VSCode.configure do |config|
  config.mode = :local
  config.port = 7658
  config.handlers = [MyHandler]
end

# Create a handler
class MyHandler < VSCode::Handler
  on_event "workspace.didSaveTextDocument" do |params|
    puts "File saved: #{params[:document][:uri]}"
  end
end

# Start the server
server = VSCode::Server::HTTP.new
server.start

# Call VS Code API from Ruby
client = VSCode::Client.new
client.window.show_information_message("Hello from Ruby!")
```

### Status Bar

The extension shows connection status in the status bar:

- 🔌 **Connecting...**: Attempting to connect
- ✓ **Connected**: Successfully connected to Ruby server
- ✗ **Disconnected**: Not connected to Ruby server

Click the status bar item to see connection details.

## Commands

- **VS Code Ruby API: Reconnect**: Manually reconnect to the Ruby server
- **VS Code Ruby API: Disconnect**: Disconnect from the Ruby server

## Events Sent to Ruby

The extension automatically sends the following VS Code events to registered Ruby handlers:

- `workspace.didSaveTextDocument`: When a file is saved
- `workspace.didOpenTextDocument`: When a file is opened
- `window.onDidChangeTextEditorSelection`: When editor selection changes

## Troubleshooting

### Extension shows "Disconnected"

1. Make sure your Ruby application is running
2. Verify the port configuration matches between VS Code and Ruby
3. Check that the `vscode-api` gem server is started
4. Try the "Reconnect" command

### Connection refused errors

- For local mode: Ensure Ruby server is running on localhost
- For Docker mode: Verify port mapping in docker-compose.yml
- For remote mode: Check firewall and network settings

### Authentication errors (remote mode)

- Verify the API key is correctly configured
- Check that the remote URL is correct and accessible

## Development

### Building from Source

```bash
npm install
npm run compile
```

### Running Tests

```bash
npm test
```

### Packaging

```bash
npm run package
```

## License

MIT

## Credits

Part of the vscode-api project: https://github.com/magenticmarketactualskill/vscode-api
