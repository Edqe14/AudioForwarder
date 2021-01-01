# AudioForwarder

Forward user voice from Discord to be accessible on web

[![enter image description here](https://img.shields.io/github/license/Edqe14/AudioForwarder?style=for-the-badge)](https://github.com/Edqe14/AudioForwarder/blob/main/LICENSE) ![Dependencies](https://img.shields.io/david/Edqe14/AudioForwarder?style=for-the-badge)  
[![js-semistandard-style](https://raw.githubusercontent.com/standard/semistandard/master/badge.svg)](https://github.com/standard/semistandard)

## Limitation/Known Issue ⚠

- Memory level stayed high when stress test stopped (possible leak)

### Important ❗

Please read `notes/README.txt`

## Features 📜

 1. Capture whitelisted users or entire voice channel (anyone) voice
 2. Realtime Audio Processing using FFMPEG
 3. Raw/Processed audio stream exposed on endpoints
 4. HTTP, HTTPS server using Express
 5. WebSocket using Socket.IO

## Tests 🔧

Found at `src/test`
| Script | Description |
|--|--|
| audio_getter.js | Get audio stream from HTTP endpoint |
| client_stresser.js | Stress test the server by spamming request for audio data |
| ws_client.js | WebSocket client example |

### Stress Test Results 🧪

- Audio delay will change depending on client count
- Tested on **`Windows 10 Pro`**, **`Ryzen 5 3500X`**, **`NVIDIA GTX 1660 Super`**

#### Client side 💻

- Client Count is **approximated**

| Client Count | Symptoms |
|--|--|
| 0 - 1999 | Not noticeable - None |
| 1200 | Small amount of short stutter |
| 1500 | Much longer and more frequent stutter |
| 1800+ | Very frequent stutter, audio alternation (speed up) |

---

#### Server side 🔗

- Client Count is **approximated**
- CPU usage **18-20%** `(Not affected by client count)`

| Client Count | Memory Used (MB) |
|--|--|
| 0 *`(STARTUP)`* | 50 |
| 500 | 100 |
| 1000 | 165 |
| 1500 | 220 |
| 1750 | 310 |
| 2000 | 405 |
| 2200 | 425 |
| 2350 | 480 |
| 2500 | 520 |
| 0 *`(END)`* | 110 |

## License 📰

**This project is using MIT license © Edqe14**  
[Click here](https://github.com/Edqe14/AudioForwarder/blob/main/LICENSE) to read LICENSE.
