const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.find({ user: req.user })
            .populate('user')
            .populate('dishes')
            .then((favs) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favs);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

        var dishes_req = req.body.map((dish) => dish._id);

        Favorites.findOne({ user: req.user })
            .then((userFavs) => {
                if (userFavs == null) {
                    Favorites.create({ user: req.user._id, dishes: dishes_req })
                        .then((userFavs) => {
                            Favorites.findById(userFavs._id)
                                .populate('user')
                                .populate('dishes')
                                .then((userFavs) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(userFavs);
                                })
                        }, (err) => next(err))
                        .catch((err) => next(err));
                }
                else {
                    dishes_req.forEach((item) => {
                        if (userFavs.dishes.indexOf(item) < 0) {
                            userFavs.dishes.push(item);
                        }
                    });

                    userFavs.save()
                        .then((userFavs) => {
                            Favorites.findById(userFavs._id)
                                .populate('user')
                                .populate('dishes')
                                .then((userFavs) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(userFavs);
                                })
                           
                        }, (err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.remove({ user: req.user })
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            },
                (err) => next(err))
            .catch((err) => next(err));
    });

favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
        .then((favorites) => {
            if (!favorites) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({ "exists": false, "favorites": favorites });
            }
            else {
                if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    return res.json({ "exists": false, "favorites": favorites });
                }
                else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    return res.json({ "exists": true, "favorites": favorites });
                }
            }

        }, (err) => next(err))
            .catch((err) => next(err))
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user })
            .then((userFavs) => {
                if (userFavs == null) {
                    Favorites.create({ user: req.user._id, dishes: [req.params.dishId] })
                        .then((userFavs) => {
                            Favorites.findById(userFavs._id)
                                .populate('user')
                                .populate('dishes')
                                .then((userFavs) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(userFavs);
                                })
                        }, (err) => next(err))
                        .catch((err) => next(err));
                }
                else {
                    if (userFavs.dishes.indexOf(req.params.dishId) < 0) {
                        userFavs.dishes.push(req.params.dishId);
                    }

                    userFavs.save()
                        .then((userFavs) => {
                            Favorites.findById(userFavs._id)
                                .populate('user')
                                .populate('dishes')
                                .then((userFavs) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(userFavs);
                                })
                        }, (err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/' + req.params.dishId);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user })
            .then((userFavs) => {
                if (userFavs != null && userFavs.dishes.indexOf(req.params.dishId) !== -1) {
                    userFavs.dishes = userFavs.dishes.filter((item) => item != req.params.dishId);

                    userFavs.save()
                        .then((userFavs) => {
                            Favorites.findById(userFavs._id)
                                .populate('user')
                                .populate('dishes')
                                .then((userFavs) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(userFavs);
                                })
                        }, (err) => next(err));
                }
                else {
                    err = new Error('Dish ' + req.params.dishId + ' not in the user\'s favorites');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = favoriteRouter;