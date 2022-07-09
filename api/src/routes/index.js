require('dotenv').config();
const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require ('axios')
const { Genre, Videogame } = require ('../db');
const { API_KEY } = process.env;
const db = require('../db');

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
const getVideogames = async () => {
    try {
        const apiUrl = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}`, {
            params: {
                number: 30
            },
        });
        const gameInfo = await apiUrl?.data.results.map(el => {
            return {
                id: el.id,
                name: el.name,
                released: el.released,
                apiImg: el.background_image,
                rating: el.rating,
                platform: el.platform,
                description: el.description,
                genre: el.genres.map(el => el)
            };
        });
        return gameInfo;
    } catch(error) {
        console.log(error);
    }
};

const getDb = async () => {
    return await Videogame.findAll({
        include: {
            model: Genre,
            attributes: ['name'];
            through: {
                attributes: [],
            }
        }
    });
};

const getAllInfo = async () => {
    const gameInfo = await getVideogames();
    const dbInfo = await getDb();
    const allInfo = gameInfo?.concat(dbInfo);
    return allInfo;
}

router.get('/videogames', async (req, res) => {
    const name = req.query.name;
    let totalGames = await getAllInfo();
    if(name) {
        let gameName = await totalGames.filter(el => el.name.toLowerCase().includes(name.toLowerCase()));
        gameName.length ? 
        res.status(200).send(gameName) : res.status(404).send('No se encontro el videojuego');
    } else {
        res.status(200).send(totalGames);
    }
});

router.get('/genres', async (req, res) => {
    const apiGenre = await axios.get(`https://api.rawg.io/api/genres?key=${API_KEY}`);
    const allGenres = apiGenre.data.map(el => el.genre);
    const eachGenre = allGenres.map(el => {
        for(let i = 0; i < el.length; i++) return el[i];
    });
    eachGenre.forEach(el => {
        Genre.findOrCreate({
            where: { name: el };
        });
    });
    const totalGenres = await Genre.findAll();
    res.send(totalGenres);
});

router.post('/videogame', async (req, res) => {
    let {
        name,
        description,
        rating,
        released,
        platforms,
        image,
        genre
    } = req.body;

    let createdGame = await Videogame.create({
        name,
        description,
        rating,
        released,
        platforms,
        image,
        creadoEnBase
    });

    let genreDb = Genre.findAll({
        where: { name : genre };
    });

    createdGame.addGenres(genreDb);
    res.send('El videojuego fue creado exitosamente');
});

router.get('/videogame/:id', async (req, res) => {
    const id = req.params.id;
    const totalGames = await getAllInfo();
    if(id) {
        const gameId = await totalGames.filter(el => el.id == id);
        gameId.length?
        res.status(200).json(gameId) :
        res.status(404).send('No se encontraron resultados')
    };
});

module.exports = router;
