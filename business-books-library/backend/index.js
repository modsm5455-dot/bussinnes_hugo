const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

// Se utiliza este port o el de entorno
const PORT = process.env.PORT || 3000;
const API_KEY = 'DG6cKaXvs7GOw0H8wtMgWL2ehdCRGilawzTBfbVTsCnM0EKM';

// Endpoint para traer todos los libros
// El usuario proporcionó explícitamente una API key. 
// Tras una evaluación, pertenece a The New York Times Books API.
app.get('/api/books', async (req, res) => {
    try {
        const query = req.query.q ? req.query.q.toLowerCase().replace('subject:business ', '').replace('subject:business', '').trim() : '';
        
        // Use the exact API Key provided by the user for NYT API
        const url = `https://api.nytimes.com/svc/books/v3/lists/current/business-books.json?api-key=${API_KEY}`;
        
        const response = await axios.get(url);
        
        if (!response.data.results || !response.data.results.books) {
            return res.json([]);
        }

        let books = response.data.results.books.map(item => {
            // Assign some random mock categories to showcase the categorization UI
            // since NYT Business list doesn't break down into sub-categories.
            const categories = ['Finance', 'Marketing', 'Entrepreneurship', 'Leadership', 'Investing'];
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];

            return {
                id: item.primary_isbn13 || item.primary_isbn10 || Math.random().toString(),
                title: item.title || 'Sin Título',
                author: item.author || 'Autor Desconocido',
                coverImage: item.book_image || 'https://placehold.co/150x200?text=Sin+Portada',
                description: item.description || 'No hay descripción disponible para este libro.',
                category: randomCategory,
                price: item.price !== "0.00" ? `$${item.price}` : 'Consultar en tienda',
                rating: 0, // Frontend handles randomizing this if 0
                infoLink: item.amazon_product_url || item.buy_links?.[0]?.url || '#'
            };
        });

        // Backend search filtering if a query exists
        if (query) {
            books = books.filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query));
        }

        res.json(books);
    } catch (error) {
        console.error('Error fetching books from NYT API:', error.message);
        res.status(500).json({ error: 'Error al obtener los libros' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend de la librería ejecutándose en el puerto ${PORT}`);
});
