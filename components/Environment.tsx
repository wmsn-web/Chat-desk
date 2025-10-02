
export function API_URL(): string {
  const envx = "dev"; // change to "prod" when you want prod — not recommended
  if (envx == "dev") {
    return "http://10.0.2.2:3595";
  } else {
    return "https://api.playpunts.com";
  }
}