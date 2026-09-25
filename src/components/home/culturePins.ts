/**
 * Static culture map.
 * Pin `top` / `left` are percentages of /culture/region-map.svg.
 * Slides are the photos in each city folder. HEIC files are paired with
 * a JPEG of the same name so the slider works in every browser.
 */

export type CultureSlide = {
  src: string;
  alt: string;
};

export type CulturePin = {
  id: "sg" | "my" | "mm" | "jp" | "vn";
  code: string;
  label: string;
  top: number;
  left: number;
  slides: readonly CultureSlide[];
};

export const CULTURE_PINS: readonly CulturePin[] = [
  {
    id: "jp",
    code: "JP",
    label: "Japan",
    top: 19.6,
    left: 89.7,
    slides: [
      { src: "/culture/JPN/IMG_3635.JPG", alt: "Japan photo 1" },
      { src: "/culture/JPN/IMG_3984.JPG", alt: "Japan photo 2" },
      { src: "/culture/JPN/IMG_3985.JPG", alt: "Japan photo 3" },
      { src: "/culture/JPN/IMG_3986.JPG", alt: "Japan photo 4" },
      { src: "/culture/JPN/IMG_3987.JPG", alt: "Japan photo 5" },
      { src: "/culture/JPN/IMG_3988.JPG", alt: "Japan photo 6" },
      { src: "/culture/JPN/IMG_3991.JPG", alt: "Japan photo 7" },
    ],
  },
  {
    id: "mm",
    code: "MM",
    label: "Myanmar",
    top: 38.2,
    left: 12.9,
    slides: [
      { src: "/culture/MM/IMG_9195.jpg", alt: "Myanmar photo 1" },
      { src: "/culture/MM/IMG_9207.jpg", alt: "Myanmar photo 2" },
    ],
  },
  {
    id: "vn",
    code: "VN",
    label: "Vietnam",
    top: 58,
    left: 42.3,
    slides: [
      { src: "/culture/VN/IMG_0010.jpg", alt: "Vietnam photo 1" },
      { src: "/culture/VN/IMG_0018.jpeg", alt: "Vietnam photo 2" },
      { src: "/culture/VN/IMG_0146.jpg", alt: "Vietnam photo 3" },
      { src: "/culture/VN/IMG_0151.jpg", alt: "Vietnam photo 4" },
      { src: "/culture/VN/IMG_0153.jpg", alt: "Vietnam photo 5" },
      { src: "/culture/VN/IMG_0214.jpg", alt: "Vietnam photo 6" },
      { src: "/culture/VN/IMG_0217.jpg", alt: "Vietnam photo 7" },
      { src: "/culture/VN/IMG_1185.jpeg", alt: "Vietnam photo 8" },
      { src: "/culture/VN/IMG_1202.jpeg", alt: "Vietnam photo 9" },
      { src: "/culture/VN/IMG_3647.jpg", alt: "Vietnam photo 10" },
      { src: "/culture/VN/IMG_6984.JPG", alt: "Vietnam photo 11" },
      { src: "/culture/VN/IMG_7136.JPG", alt: "Vietnam photo 12" },
      { src: "/culture/VN/IMG_7146.JPG", alt: "Vietnam photo 13" },
      { src: "/culture/VN/IMG_9767.jpg", alt: "Vietnam photo 14" },
      { src: "/culture/VN/IMG_9769.jpg", alt: "Vietnam photo 15" },
      { src: "/culture/VN/IMG_9770.jpg", alt: "Vietnam photo 16" },
      { src: "/culture/VN/IMG_9922.jpg", alt: "Vietnam photo 17" },
      { src: "/culture/VN/IMG_9965.jpg", alt: "Vietnam photo 18" },
      { src: "/culture/VN/IMG_9967.jpg", alt: "Vietnam photo 19" },
    ],
  },
  {
    id: "my",
    code: "MY",
    label: "Malaysia",
    top: 83.1,
    left: 28.4,
    slides: [
      { src: "/culture/MY/IMG_3421.JPG", alt: "Malaysia photo 1" },
      { src: "/culture/MY/IMG_3422.JPG", alt: "Malaysia photo 2" },
      { src: "/culture/MY/IMG_3630.jpg", alt: "Malaysia photo 3" },
      { src: "/culture/MY/IMG_3832.JPG", alt: "Malaysia photo 4" },
      { src: "/culture/MY/IMG_3835.JPG", alt: "Malaysia photo 5" },
      { src: "/culture/MY/IMG_5971.jpg", alt: "Malaysia photo 6" },
      { src: "/culture/MY/IMG_7588.jpg", alt: "Malaysia photo 7" },
      { src: "/culture/MY/IMG_7594.jpg", alt: "Malaysia photo 8" },
      { src: "/culture/MY/IMG_7595.jpg", alt: "Malaysia photo 9" },
      { src: "/culture/MY/IMG_7596.jpg", alt: "Malaysia photo 10" },
      { src: "/culture/MY/IMG_7642.jpg", alt: "Malaysia photo 11" },
      { src: "/culture/MY/IMG_9854.jpg", alt: "Malaysia photo 12" },
    ],
  },
  {
    id: "sg",
    code: "SG",
    label: "Singapore",
    top: 89.1,
    left: 34.3,
    slides: [
      { src: "/culture/SG/IMG_2349.JPG", alt: "Singapore photo 1" },
      { src: "/culture/SG/IMG_3149.JPG", alt: "Singapore photo 2" },
      { src: "/culture/SG/IMG_3169.JPG", alt: "Singapore photo 3" },
      { src: "/culture/SG/IMG_3182.JPG", alt: "Singapore photo 4" },
      { src: "/culture/SG/IMG_3189.JPG", alt: "Singapore photo 5" },
      { src: "/culture/SG/IMG_3208.JPG", alt: "Singapore photo 6" },
      { src: "/culture/SG/dji_mimo_20260821_165802_20260821165801_1787544533807_photo.JPG", alt: "Singapore photo 7" },
      { src: "/culture/SG/dji_mimo_20260821_182634_20260821182634_1787544531530_photo.JPG", alt: "Singapore photo 8" },
    ],
  },
];
