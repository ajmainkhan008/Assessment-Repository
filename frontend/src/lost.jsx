
import { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function Lost() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    item_name: "",
    description: "",
    category: "",
    location: "",
    date_of_incident: "",
    contact_name: "",
    contact_phone: "",
    image: null,
  });

  function handleChange(e) {
    const { name, value, files } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: files ? files[0] : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        data.append(key, value);
      }
    });

    data.append("report_type", "LOST");

    try {
      const response = await fetch(`${API_URL}/api/reports/`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          Object.values(result).flat().join(" ") ||
          "Unable to submit report."
        );
      }

      setMessage("Your lost-item report was submitted successfully!");

      setForm({
        item_name: "",
        description: "",
        category: "",
        location: "",
        date_of_incident: "",
        contact_name: "",
        contact_phone: "",
        image: null,
      });

      e.target.reset();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-card">
      <div className="form-heading">
        <div>
          <h2>Report a Lost Item</h2>
          <p>Tell us about the item you lost.</p>
        </div>
        <span className="form-number">01</span>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>

        <div className="field">
          <label>Item Name *</label>
          <input
            name="item_name"
            value={form.item_name}
            onChange={handleChange}
            placeholder="e.g. Black wallet"
            required
          />
        </div>

        <div className="field">
          <label>Category *</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            <option value="Electronics">Electronics</option>
            <option value="Bags">Bags</option>
            <option value="Documents">Documents</option>
            <option value="Wallet">Wallet</option>
            <option value="Clothing">Clothing</option>
            <option value="Accessories">Accessories</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="field">
          <label>Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the item..."
            rows="4"
            required
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Lost Location *</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Where did you lose it?"
              required
            />
          </div>

          <div className="field">
            <label>Date Lost *</label>
            <input
              type="date"
              name="date_of_incident"
              value={form.date_of_incident}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-divider" />
        <h3>Your Contact Information</h3>

        <div className="field-row">
          <div className="field">
            <label>Your Name *</label>
            <input
              name="contact_name"
              value={form.contact_name}
              onChange={handleChange}
              placeholder="Full name"
              required
            />
          </div>

          <div className="field">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="contact_phone"
              value={form.contact_phone}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>
        </div>

        <div className="field">
          <label>Item Image (Optional)</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
        </div>

        <button className="submit-button" disabled={loading}>
          {loading ? "Submitting..." : "Submit Lost Item Report"}
        </button>

      </form>
    </section>
  );
}

export default Lost;
