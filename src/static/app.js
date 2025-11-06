document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // helper to escape HTML in participant strings
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants markup (pretty pills or empty message)
        let participantsMarkup;
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          participantsMarkup = `
            <div class="participants-section">
              <strong>Participants (${details.participants.length}):</strong>
              <ul class="participants-list" style="list-style: none; padding-left: 0;">
                ${details.participants
                  .map((p) => `
                    <li class="participant-item" style="display: flex; align-items: center; gap: 6px;">
                      <span>${escapeHtml(p)}</span>
                      <button class="delete-participant-btn" title="Remove participant" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" style="background: none; border: none; color: #c00; cursor: pointer; font-size: 1.1em; padding: 0 4px;">✖️</button>
                    </li>
                  `)
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsMarkup = `<div class="participants-section participants-empty">No participants yet</div>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description || "")}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule || "")}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsMarkup}
        `;


        activitiesList.appendChild(activityCard);

        // Add delete event listeners for participant delete buttons
        setTimeout(() => {
          activityCard.querySelectorAll('.delete-participant-btn').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
              const activity = btn.getAttribute('data-activity');
              const email = btn.getAttribute('data-email');
              if (!activity || !email) return;
              if (!confirm(`Remove ${email} from ${activity}?`)) return;
              try {
                const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participant/${encodeURIComponent(email)}`, {
                  method: 'DELETE',
                });
                const result = await resp.json();
                if (resp.ok) {
                  fetchActivities();
                } else {
                  alert(result.detail || 'Failed to remove participant.');
                }
              } catch (err) {
                alert('Error removing participant.');
              }
            });
          });
        }, 0);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list so UI updates
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
