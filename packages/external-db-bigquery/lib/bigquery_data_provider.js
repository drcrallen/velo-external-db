const { unPatchDateTime, patchDateTime } = require('./bigquery_utils')
const { asParamArrays, updateFieldsFor } = require('velo-external-db-commons')
const { translateErrorCodes } = require('./sql_exception_translator')

const escapeIdentifier = i => i
class DataProvider {
    constructor(pool, filterParser) {
        this.filterParser = filterParser
        this.pool = pool
    }

    async find(collectionName, filter, sort, skip, limit) {
        const { filterExpr, parameters } = this.filterParser.transform(filter)
        const { sortExpr } = this.filterParser.orderBy(sort)

        const sql = `SELECT * FROM ${escapeIdentifier(collectionName)} ${filterExpr} ${sortExpr} LIMIT ${limit} OFFSET ${skip}`

        const resultSet = await this.pool.query({ query: sql, params: parameters })
                                         .catch( translateErrorCodes )

        return resultSet[0].map( unPatchDateTime )
    }

    async count(collectionName, filter) {
        const { filterExpr, parameters } = this.filterParser.transform(filter)
        const sql = `SELECT COUNT(*) AS num FROM ${escapeIdentifier(collectionName)} ${filterExpr}`

        const resultSet = await this.pool.query({
            query: sql,
            params: parameters
        })
    
        return resultSet[0][0]['num']
    }

    async insert(collectionName, items) {
        // const patchedItems = items.map(patchDateTime)
        // const itemsArr = patchedItems.map( item => `(${Object.values(item).map(i => typeof(i) === 'number' ? i : `"${i}"`).join(', ')})` ).join(', ')
        // const sql = `INSERT INTO \`${collectionName}\` (${Object.keys(items[0]).join(', ')}) VALUES ${itemsArr}`

        // const res = await this.pool.query(sql).catch( translateErrorCodes )

        const table = await this.pool.table(collectionName)
        const res = await table.insert(items)
    
        return res
    }

    async update(collectionName, items) {
        const updateFields = updateFieldsFor(items[0])
        const queries = items.map(() => `UPDATE ${escapeIdentifier(collectionName)} SET ${updateFields.map(f => `${escapeIdentifier(f)} = ?`).join(', ')} WHERE _id = ?` )
                             .join(';')
        const updatables = items.map(i => [...updateFields, '_id'].reduce((obj, key) => ({ ...obj, [key]: i[key] }), {}) )
                                .map(u => asParamArrays( patchDateTime(u) ))

        const resultSet = await this.pool.query({ query: queries, params: [].concat(...updatables) })
                                    .catch( translateErrorCodes )

        return resultSet[0].length
    }

    async delete(collectionName, itemIds) {
        const sql = `DELETE FROM ${escapeIdentifier(collectionName)} WHERE _id IN UNNEST(@idsList)`

        const rs = await this.pool.query({ query: sql, params: { idsList: itemIds }, types: { idsList: ['STRING'] } })
                             .catch( translateErrorCodes )
        
        return rs[0]
    }

    async truncate(collectionName) {
        await this.pool.query(`TRUNCATE TABLE ${escapeIdentifier(collectionName)}`)
                  .catch( translateErrorCodes )
    }

    async aggregate(collectionName, filter, aggregation) {
        const { filterExpr: whereFilterExpr, parameters: whereParameters } = this.filterParser.transform(filter)
        const { fieldsStatement, groupByColumns, havingFilter, parameters } = this.filterParser.parseAggregation(aggregation.processingStep, aggregation.postFilteringStep)

        const sql = `SELECT ${fieldsStatement} FROM ${escapeIdentifier(collectionName)} ${whereFilterExpr} GROUP BY ${groupByColumns.map( escapeIdentifier ).join(', ')} ${havingFilter}`

        const resultSet = await this.pool.query({ query: sql, params: [...whereParameters, ...parameters] })
                                    .catch( translateErrorCodes )

        return resultSet[0]
    }
}

module.exports = DataProvider