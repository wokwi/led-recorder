# LED Animation Recorder

Use this tool to record Wokwi LED animations into a binary file.

## File format

The file begins with a 32 byte header, followed by animation frames. All values are little endian.

The header contains the following fields:

| Offset | Bytes | Name    | Description                |
| ------ | ----- | ------- | -------------------------- |
| 0      | 8     | magic   | "WokwiLED"                 |
| 8      | 4     | version | Always 1                   |
| 12     | 4     | nframes | Number of frames           |
| 16     | 4     | npixels | Number of pixels per frame |
| 20     | 12    |         | Reserved, set to 0         |

Each frame is an array of `npixels` DWORDs. Each element is in the following
format: `0x00GGRRBB`, where `GG` indicatates the green value, `RR` indicates
the red value, and `BB` (the lowest byte) indicates the blue value.

The player currently assumes 60fps.

## License

Copyright (C) 2021 Uri Shaked. Released under the [MIT license](LICENSE).
