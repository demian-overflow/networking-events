import { Header } from "../components/Header";
import { EventList } from "../components/EventList";

export function HomePage() {
  return (
    <>
      <Header />
      <main className="main">
        <EventList />
      </main>
    </>
  );
}
