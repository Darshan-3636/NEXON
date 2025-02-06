const Orders = [
    {
        productName: 'JavaScript Tutorial',
        productNumber: '85743',
        paymentStatus: 'Due',
        status: 'Pending'
    },
    {
        productName: 'CSS Full Course',
        productNumber: '97245',
        paymentStatus: 'Refunded',
        status: 'Declined'
    },
    {
        productName: 'Flex-Box Tutorial',
        productNumber: '36452',
        paymentStatus: 'Paid',
        status: 'Active'
    },
]

function loadOrders() {
    const tableBody = document.getElementById('orders-table');

    Orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.productName}</td>
            <td>${order.productNumber}</td>
            <td>${order.paymentStatus}</td>
            <td>${order.status}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Load orders when the page loads
window.onload = loadOrders;