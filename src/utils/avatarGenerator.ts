import { generate } from "random-words";

export default function AvatarGenerator(text?: string) {
  // TODO: implenent random text generator here for random avatars
  return `https://api.multiavatar.com/${text || generate()}.png`;
}
