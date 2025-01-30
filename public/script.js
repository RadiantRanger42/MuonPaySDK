var base_url = "http://localhost:5001";

// Function to fetch the balance and update the DOM
async function fetchAndUpdateBalance() {
    try {
      // Sending POST request to the endpoint
      const response = await fetch(base_url +'/api/user/transaction/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Ensure the server accepts JSON
        },
        body: JSON.stringify({}), // Include any required body payload if needed
      });
  
      // Parsing JSON response
      const data = await response.json();
  
      // Check if the request was successful
      if (data.success) {
        // Update the innerHTML of the element with ID 'total_balance'
        const totalBalanceElement = document.getElementById('total_balance');
        if (totalBalanceElement) {
          totalBalanceElement.innerHTML = data.totalBalance / 100000000;
        } else {
          console.error("Element with ID 'total_balance' not found.");
        }
      } else {
        console.error('Error:', data.message);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }
  

// function  call api and get the last 7 days payment (processed amount that was recieved)
async function fetch_last_7_days() {
    try {
      // Sending POST request to the endpoint
      const response = await fetch(base_url +'/admin/last_7_days', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Ensure the server accepts JSON
        },
        body: JSON.stringify({}), // Include any required body payload if needed
      });
  
      // Parsing JSON response
      const data = await response.json();
  
      // Check if the request was successful
      if (data.success) {
        // Update the innerHTML of the element with ID 'total_balance'
        const last_7_daysElement = document.getElementById('last_7_days');
        if (last_7_daysElement) {
            last_7_daysElement.innerHTML = data.amount_last_7_days;
        } else {
          console.error("None Found");
        }
      } else {
        console.error('Error:', data.message);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }
  

  // function  call api and get the pending payment (that is pending and waiting for confirmation)
async function pending_pay() {
    try {
      // Sending POST request to the endpoint
      const response = await fetch(base_url +'/admin/pending_payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Ensure the server accepts JSON
        },
        body: JSON.stringify({}), // Include any required body payload if needed
      });
  
      // Parsing JSON response
      const data = await response.json();
  
      // Check if the request was successful
      if (data.success) {
        // Update the innerHTML of the element with ID 'total_balance'
        const pending_payElement = document.getElementById('pending_payElement');
        if (pending_payElement) {
            pending_payElement.innerHTML = data.pending;
        } else {
          console.error("None Found");
        }
      } else {
        console.error('Error:', data.message);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }


//   function to call admin api and get the completed payments 
async function completed_pay() {
    try {
      // Sending POST request to the endpoint
      const response = await fetch(base_url +'/admin/completed_payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Ensure the server accepts JSON
        },
        body: JSON.stringify({}), // Include any required body payload if needed
      });
  
      // Parsing JSON response
      const data = await response.json();
  
      // Check if the request was successful
      if (data.success) {
        // Update the innerHTML of the element with ID 'total_balance'
        const completed_payElement = document.getElementById('completed_payElement');
        if (completed_payElement) {
            completed_payElement.innerHTML = data.completed;
        } else {
          console.error("None Found");
        }
      } else {
        console.error('Error:', data.message);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }



  // Function to get query parameters from URL
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Check for 'msg' and 'msg_type' in the URL
  const msg = getQueryParam("msg");
  const msgType = getQueryParam("msg_type"); // e.g., "success", "error", etc.

  if (msg) {
    // Create a div to display the message
    const alertDiv = document.createElement("div");
    alertDiv.textContent = decodeURIComponent(msg); // Decode the message

    // Add classes based on the message type
    if (msgType === "success") {
      alertDiv.className = "alert alert-success"; // Use Bootstrap success styling
    } else if (msgType === "error") {
      alertDiv.className = "alert alert-danger"; // Use Bootstrap error styling
    } else {
      alertDiv.className = "alert alert-info"; // Default info styling
    }

    // Find the main-panel div
    const mainPanel = document.querySelector(".main-panel");

    if (mainPanel) {
      // Insert the alertDiv at the beginning of the main-panel div
      mainPanel.insertAdjacentElement("afterbegin", alertDiv);

      // Optional: Automatically hide the message after 5 seconds
      setTimeout(() => {
        alertDiv.remove();
      }, 5000);
    }
  }


document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.querySelector(".nav");

    const menuItems = [
        { url: "/admin-user-panel/server.html", icon: "mdi-server", title: "Electrumx Server" },
        { url: "/admin-user-panel/completed.html", icon: "mdi-check-circle", title: "Completed Deposits" },
        { url: "/admin-user-panel/pending.html", icon: "mdi-clock-outline", title: "Pending Deposits" }
    ];

    menuItems.forEach(item => {
        const li = document.createElement("li");
        li.className = "nav-item menu-items";
        li.innerHTML = `
            <a class="nav-link" href="${item.url}">
                <span class="menu-icon">
                    <i class="mdi ${item.icon}"></i>
                </span>
                <span class="menu-title">${item.title}</span>
            </a>
        `;
        sidebar.appendChild(li);
    });
});

