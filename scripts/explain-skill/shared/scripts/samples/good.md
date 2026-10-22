# What the daemon does

The daemon is a process that runs in the background. It has no window.

When you ask for a task, the daemon packs the context. Then it sends one request to the provider. The provider sends back a response in small pieces.

If the response asks for a tool, the daemon runs the tool in the sandbox. Then the daemon sends the result in a new request.

Open the log with `ccft log --tail`. Read the last 20 lines.

- Start the daemon.
- Send the request.
