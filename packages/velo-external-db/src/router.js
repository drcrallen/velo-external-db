const path = require('path')
const express = require('express')

const createRouter = (dataService, schemaService) => {
    
    const router = express.Router()


    // *************** INFO **********************
    router.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    })

    router.post('/provision', (req, res) => {
        res.json({});
    })

    // *************** Data API **********************
    router.post('/data/find', async (req, res, next) => {
        try {
            const { collectionName, filter, sort, skip, limit } = req.body
            const data = await dataService.find(collectionName, filter, sort, skip, limit)
            res.json(data)
        } catch (e) {
            next(e)
        }
    })

    router.post('/data/aggregate', async (req, res, next) => {
        try {
            const { collectionName, filter, aggregation } = req.body
            const data = await dataService.aggregate(collectionName, filter, aggregation)
            res.json(data)
        } catch (e) {
            next(e)
        }
    })

    router.post('/data/insert', async (req, res, next) => {
        try {
            const { collectionName, item } = req.body
            const data = await dataService.insert(collectionName, item)
            res.json(data)
        } catch (e) {
            next(e)
        }
    })

    router.post('/data/insert/bulk', async (req, res, next) => {
        try {
            const { collectionName, items } = req.body
            const data = await dataService.bulkInsert(collectionName, items)
            res.json(data)
        } catch (e) {
            next(e)
        }
    })

    router.post('/data/get', async (req, res, next) => {
        try {
            const { collectionName, itemId } = req.body
            const data = await dataService.getById(collectionName, itemId)
            res.json(data)
        } catch (e) {
            next(e)
        }
    })

    router.post('/data/update', async (req, res, next) => {
        try {
            const { collectionName, item } = req.body
            const data = await dataService.update(collectionName, item)
            res.json(data)
        } catch (e) {
            next(e)
        }
    })

    router.post('/data/update/bulk', async (req, res, next) => {
        try {
            const { collectionName, items } = req.body
            const data = await dataService.bulkUpdate(collectionName, items)
            res.json(data)
        } catch (e) {
            next(e)
        }
    })

    router.post('/data/remove', async (req, res, next) => {
        try {
            const { collectionName, itemId } = req.body
            const data = await dataService.delete(collectionName, itemId)
            res.json(data)
        } catch (e) {
            next(e)
        }
    })

    router.post('/data/remove/bulk', async (req, res, next) => {
        try {
            const { collectionName, itemIds } = req.body
            const data = await dataService.bulkDelete(collectionName, itemIds)
            res.json(data)
        } catch (e) {
            next(e)
        }
    })

    router.post('/data/count', async (req, res, next) => {
        try {
            const { collectionName, filter } = req.body
            const data = await dataService.count(collectionName, filter)
            res.json(data)
        } catch (e) {
            next(e)
        }
    })

    router.post('/data/truncate', async (req, res, next) => {
        try {
            const { collectionName } = req.body
            const data = await dataService.truncate(collectionName)
            res.json(data)
        } catch (e) {
            next(e)
        }
    })
    // ***********************************************


    // *************** Schema API **********************
    router.post('/schemas/list', async (req, res) => {
        const data = await schemaService.list()
        res.json(data)
    })

    router.post('/schemas/find', async (req, res) => {
        const { schemaIds } = req.body
        const data = await schemaService.find(schemaIds)
        res.json(data)
    })

    router.post('/schemas/create', async (req, res) => {
        const { collectionName } = req.body
        const data = await schemaService.create(collectionName)
        res.json(data)
    })

    router.post('/schemas/column/add', async (req, res) => {
        const { collectionName, column } = req.body
        const data = await schemaService.addColumn(collectionName, column)
        res.json(data)
    })

    router.post('/schemas/column/remove', async (req, res) => {
        const { collectionName, columnName } = req.body
        const data = await schemaService.removeColumn(collectionName, columnName)
        res.json(data)
    })
    // ***********************************************
    return router
}
module.exports = createRouter