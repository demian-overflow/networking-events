import { useEffect } from "react";
import { Header } from "../components/Header";
import { EventList } from "../components/EventList";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchEvents, selectEventsLoaded } from "../store/eventsSlice";

export function HomePage() {
  const dispatch = useAppDispatch();
  const loaded = useAppSelector(selectEventsLoaded);

  useEffect(() => {
    if (!loaded) {
      dispatch(fetchEvents());
    }
  }, [dispatch, loaded]);

  return (
    <>
      <Header />
      <main className="main">
        <EventList />
      </main>
    </>
  );
}
