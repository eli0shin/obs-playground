export const dynamic = "force-dynamic";

export default function Error500Page() {
  throw new Error("Intentional 500 error during page render");
}
