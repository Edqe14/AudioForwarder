<div align="center">
  <img src="https://i.imgur.com/hnvQ6GV.png" alt="logo" style="width: 75%; height: auto;"></img>
  <h4>Forward user voice from Discord to be accessible on web</h4>

  <a href="https://github.com/Edqe14/AudioForwarder/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Edqe14/AudioForwarder?style=for-the-badge" alt="License"></img></a>
  <a href="https://david-dm.org/edqe14/AudioForwarder"><img src="https://img.shields.io/david/Edqe14/AudioForwarder?style=for-the-badge" alt="Dependencies"></img></a>
  <br>
  <a href="https://github.com/standard/semistandard"><img src="https://raw.githubusercontent.com/standard/semistandard/master/badge.svg" alt="Semi-standard"></img></a>
</div>

## Limitation/Known Issue ⚠

- Memory level stayed high when stress test stopped (possible leak). Refer to [server-side test result](#server-side-)

### Important ❗

Please read `notes/README.txt`

## Features 📜

 1. Capture whitelisted users or entire voice channel (anyone) voice
 2. Realtime Audio Processing using FFMPEG
 3. Raw/Processed audio stream exposed on endpoints
 4. HTTP, HTTPS server using Express
 5. WebSocket using Socket.IO
 6. WebRTC transmission

## Tests 🔧

Found at `src/test`

| Script | Description |
|--|--|
| AudioGetter.ts | Get audio stream from HTTP endpoint |
| ClientStresser.ts | Stress test the server by spamming request for audio data |
| WSClient.ts | WebSocket client example |

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
| 0 *`(START)`* | 50 |
| 500 | 100 |
| 1000 | 165 |
| 1500 | 200 |
| 1750 | 226 |
| 2000 | 250 |
| 0 *`(END)`* | 130 |

## License 📰

**This project is using MIT license © Edqe14**  
[Click here](https://github.com/Edqe14/AudioForwarder/blob/main/LICENSE) to read LICENSE.
