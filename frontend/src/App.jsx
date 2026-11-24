
import { useState } from "react";
import Lost from "./lost";
import Found from "./found";
import Login from "./login";
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
        <div className="navbar-inner">
          <button
            className="brand"
            onClick={() => navigate("lost")}
            type="button"
          >
            <span className="brand-icon">L</span>
            <span>Lost & Found</span>
          </button>

          <nav className="nav-links">
            <button
              className={page === "lost" ? "nav-link active" : "nav-link"}
              onClick={() => navigate("lost")}
            >
              Lost Item
            </button>

            <button
              className={page === "found" ? "nav-link active" : "nav-link"}
              onClick={() => navigate("found")}
            >
              Found Item
            </button>

            <button
              className={page === "login" ? "nav-link active" : "nav-link"}
              onClick={() => navigate("login")}
            >
              Admin Login
            </button>
          </nav>
        </div>
      </header>

      {page === "login" ? (
        <Login onBack={() => navigate("lost")} />
      ) : (
        <main className="main-content">
          <section className="page-heading">
            <h1>
              {page === "found"
                ? "Report a Found Item"
                : "Report a Lost Item"}
            </h1>

            <p>
              {page === "found"
                ? "Found something? Submit the details below to help return it to its owner."
                : "Lost something? Submit a report so we can help you find it."}
            </p>
          </section>

          {page === "found" ? <Found /> : <Lost />}

          <footer className="footer">
            Lost & Found Management System
          </footer>
        </main>
      )}
    </div>
  );
}

export default App;
