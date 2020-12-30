# AudioForwarder

Forward user voice from Discord to be accessible on web

[![enter image description here](https://img.shields.io/github/license/Edqe14/AudioForwarder?style=for-the-badge)](https://github.com/Edqe14/AudioForwarder/blob/main/LICENSE) ![Dependencies](https://img.shields.io/david/Edqe14/AudioForwarder?style=for-the-badge)  
[![js-semistandard-style](https://raw.githubusercontent.com/standard/semistandard/master/badge.svg)](https://github.com/standard/semistandard)

## Limitation/Known Issue

- Approx. 20% CPU usage & 50MB memory used **ON STARTUP**
- Approx. max 1500 clients/listener (http(s)) on 1 instance
- Memory level stayed high when stress test stopped (possible leak)

### Important

Please read `notes/README.txt`

## Features

 1. Capture whitelisted users or entire voice channel (anyone) voice
 2. Realtime Audio Processing using FFMPEG
 3. Raw/Processed audio stream exposed on endpoints
 4. HTTP server using Express

## License

**This project is using MIT license © Edqe14**  
[Click here](https://github.com/Edqe14/AudioForwarder/blob/main/LICENSE) to read LICENSE.
