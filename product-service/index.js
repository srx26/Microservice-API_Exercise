const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

app.use(express.json());

let products = [];

// JWT Validation Middleware
function authenticateToken(req, res, next) {

    try {
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.sendStatus(401);
        }

        jwt.verify(token, 'yourSecretKey', (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        })

    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error'});
    }
}


// RBAC (Role-Based Access Control) Middleware
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access Denied' });
        }
        next();
    }
}


// Route for Creating a Product
app.post('/products', authenticateToken, authorizeRoles('admin'), (req, res) => {
    try {
        const productId = Date.now();
        const { name, price} = req.body;

        if (!name || !price) {
            return res.status(400).json({ message: 'Name and Price are required fields!'});
        }

        const product = {
            productId,
            name,
            price
        };

        products.push(product);
        res.status(201).json({ message: 'Successfully added product!'});

    } catch (error) {
        res.status(500).json({ message: 'Could Not Create Product'});
    }
})

// (Optional Route) Route for Retrieving all products
app.get('/products', authenticateToken, (req, res) => {
    try {
        if (!products) {
            return res.status(400).json({ message: 'Products Do Not Exist'});
        }

        res.json(products);

    } catch (error) {
        res.status(500).json({ message: 'Could Not Retrieve Products'});
    }
})


// Route for Retrieving Product Details by ID
app.get('/products/:productId', authenticateToken, authorizeRoles('admin'), (req, res) => {
    try {
        const product = products.find(p => p.productId == req.params.productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not Found'});
        }

        res.send(product);

    } catch (error) {
        res.status(500).json({ message: 'Could Not Retrieve Product'});
    }
})

// Route for Updating a Product by ID
app.put('/products/:productId', authenticateToken, authorizeRoles('admin'), (req, res) => {
    try {
        const product = products.find(p => p.productId == req.params.productId);

        if (!product) {
            return res.status(400).json({ message: 'Product not Found' });
        }

        Object.assign(product, req.body);
        res.status(200).json({ message: 'Successfully Updated Product' });

    } catch (error) {
        res.status(500).json({ message: 'Could Not Update Product' });
    }
})

// Route for Deleting a Product by ID
app.delete('/products/:productId', authenticateToken, authorizeRoles('admin'), (req, res) => {
    try {
        products = products.filter(p => p.productId != req.params.productId);
        res.status(200).json({ message: 'Successfully Deleted Product'});
    } catch (error) {
        res.status(500).json({ message: 'Could Not Delete Product'});
    }
})

app.listen(3001, () => {
    console.log('Product service is running on port 3001');
})