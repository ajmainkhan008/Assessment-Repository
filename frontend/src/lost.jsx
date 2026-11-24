
import { useState } from "react";

const API_URL = "http://localhost:8000";

function Lost() {
  const [form, setForm] = useState({
    item_name: "",
    category: "",
    description: "",
    location: "",
    date_of_incident: "",
    contact_name: "",
    contact_phone: "",
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      data.append(key, value);
    });

    data.append("report_type", "LOST");

    if (image) {
      data.append("image", image);
    }

    try {
      const response = await fetch(`${API_URL}/api/reports/`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to submit your report. Please check the form."
        );
      }

      setMessage("Your lost-item report has been submitted successfully!");

      setForm({
        item_name: "",
        category: "",
        description: "",
        location: "",
        date_of_incident: "",
        contact_name: "",
        contact_phone: "",
      });

      setImage(null);

      e.target.reset();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-card">
      <div className="form-card-heading">
        <h2>Lost Item Information</h2>
        <p>Please provide as much detail as possible.</p>
      </div>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Item Name *</label>
            <input
              type="text"
              name="item_name"
              value={form.item_name}
              onChange={handleChange}
              placeholder="e.g. Black wallet"
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="Electronics">Electronics</option>
              <option value="Bags">Bags</option>
              <option value="Documents">Documents</option>
              <option value="Clothing">Clothing</option>
              <option value="Accessories">Accessories</option>
              <option value="Keys">Keys</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the item, including its color, brand, or other identifying details."
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>Last Seen Location *</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Where did you lose it?"
              required
            />
          </div>

          <div className="form-group">
            <label>Date Lost *</label>
            <input
              type="date"
              name="date_of_incident"
              value={form.date_of_incident}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              name="contact_name"
              value={form.contact_name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number *</label>
            <input
              type="tel"
              name="contact_phone"
              value={form.contact_phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Item Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0] || null)}
            />
            <small>Upload an image if you have one.</small>
          </div>
        </div>

        <button className="submit-button" type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Lost Item Report"}
        </button>
      </form>
    </section>
  );
}

export default Lost;
