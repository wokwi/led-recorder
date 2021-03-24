# LED Animation Recorder

Use this tool to export LED animation from Wokwi into [NDJSON](http://ndjson.org/) / [JSON Lines](https://jsonlines.org/) or binary files.

## Usage

Add the following part to your [diagram.json file](https://docs.wokwi.com/diagram-format), specifying the number of pixels in the strip/matrix:

```json
{
  "type": "wokwi-neopixel-strip",
  "id": "neopixels",
  "attrs": { "pixels": "3" }
}
```

Note that the part id _must_ be `neopixels` for the recorder to work.

and then add a customView:

```json
  "customView": "https://wokwi.github.io/led-recorder",
```

Example for a complete diagram.json file:

```json
{
  "version": 1,
  "author": "Uri Shaked",
  "editor": "wokwi",
  "customView": "https://wokwi.github.io/led-recorder",
  "parts": [
    {
      "type": "wokwi-arduino-uno",
      "id": "uno",
      "top": 0,
      "left": 150
    },
    {
      "type": "wokwi-neopixel-strip",
      "id": "neopixels",
      "attrs": { "pixels": "3" }
    }
  ],
  "connections": [["uno:3", "neopixels:DIN", ""]]
}
```

## File format (NDJSON / JSON Lines)

Each line is a JSON object. The first line is a header line, which contains information about the recording. The animation frames are encoded in the subsequent lines, one line per frame.

The header contains the following fields:

| Name      | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| magic     | string | "WokwiLED"                           |
| version   | number | Always 1                             |
| pixels    | number | Number of pixels per frame           |
| frameRate | number | Frames per second (usually 30 or 60) |

The frames contain the following fields:

| Name      | Type   | Description                             |
| --------- | ------ | --------------------------------------- |
| frame     | number | Frame index, starting from 0            |
| leds      | array  | LED values:                             |
| leds[n].r | number | The red value of pixel `n`              |
| leds[n].g | number | The green value of pixel `n`            |
| leds[n].b | number | The blue value of pixel `n`             |
| leds[n].a | number | The alpha value of pixel `n` (optional) |

Pixel values (r, g, b, a) are integer values between 0 and 255.

Example:

```json
{ "magic": "WokwiLED", "version": 1, "pixels": 3, "frameRate": 30 }
{ "frame": 0, "leds": [ {"r":255,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0} ] }
{ "frame": 1, "leds": [ {"r":0,"g":0,"b":0}, {"r":0,"g":255,"b":0}, {"r":0,"g":0,"b":0} ] }
{ "frame": 2, "leds": [ {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":0}, {"r":0,"g":0,"b":255} ] }
{ "frame": 3, "leds": [ {"r":0,"g":0,"b":0}, {"r":0,"g":255,"b":0}, {"r":0,"g":0,"b":0} ] }
...
```

## File format (binary)

The file begins with a 32 byte header, followed by animation frames. All values are little endian.

The header contains the following fields:

| Offset | Bytes | Name    | Description                 |
| ------ | ----- | ------- | --------------------------- |
| 0      | 8     | magic   | "WokwiLED"                  |
| 8      | 4     | version | Always 1                    |
| 12     | 4     | nframes | Number of frames            |
| 16     | 4     | npixels | Number of pixels per frame  |
| 20     | 4     | fps     | Number of frames per second |
| 24     | 8     |         | Reserved, set to 0          |

Each frame is an array of `npixels` DWORDs. Each element is in the following
format: `0x00GGRRBB`, where `GG` indicatates the green value, `RR` indicates
the red value, and `BB` (the lowest byte) indicates the blue value.

## License

Copyright (C) 2021 Uri Shaked. Released under the [MIT license](LICENSE).
