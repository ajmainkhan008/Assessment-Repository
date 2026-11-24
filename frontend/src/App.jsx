import { useState } from "react";
import Lost from "./lost";
import Found from "./found";
import Login from "./login";
import LostFoundPanel from "./components/LostFoundPanel";
import "./App.css";

function App() {
  const [page, setPage] = useState("lost");

  function navigate(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand" onClick={() => navigate("lost")}>
          <span className="brand-icon">L</span>
          <span>Lost &amp; Found</span>
        </div>

        <nav>
          <button
            className={page === "lost" ? "nav-active" : ""}
            onClick={() => navigate("lost")}
          >
            Lost Item
          </button>

          <button
            className={page === "found" ? "nav-active" : ""}
            onClick={() => navigate("found")}
          >
            Found Item
          </button>

          <button
            className={page === "register" ? "nav-active" : ""}
            onClick={() => navigate("register")}
          >
            Central Register
          </button>

          <button
            className={page === "login" ? "nav-active admin-link" : "admin-link"}
            onClick={() => navigate("login")}
          >
            Admin Login
          </button>
        </nav>
      </header>

      {page === "login" ? (
        <Login onBack={() => navigate("lost")} />
      ) : page === "register" ? (
        <main className="main-content">
          <LostFoundPanel />
        </main>
      ) : (
        <main className="main-content">
          <section className="hero">
            <div className="hero-tag">
              LOST SOMETHING? FOUND SOMETHING?
            </div>

            <h1>
              {page === "found"
                ? "Report a Found Item"
                : "Report a Lost Item"}
            </h1>

            <p>
              {page === "found"
                ? "Help return someone's belongings by reporting the item you found."
                : "Submit a report and help us reunite you with your belongings."}
            </p>
          </section>

          {page === "found" ? <Found /> : <Lost />}

          <p className="footer-note">
            Your information will be used to help identify and return lost belongings.
          </p>
        </main>
      )}
    </div>
  );
}

export default App;