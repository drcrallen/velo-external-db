const translateErrorCodes = require('./sql_exception_translator')
const SchemaColumnTranslator = require('./sql_schema_translator')
const { escapeIdentifier } = require('./postgres_utils')
const { CollectionDoesNotExists} = require('velo-external-db-commons').errors
const { SystemFields, validateSystemFields, asWixSchema } = require('velo-external-db-commons')

class SchemaProvider {
    constructor(pool) {
        this.pool = pool

        this.systemFields = SystemFields
        this.sqlSchemaTranslator = new SchemaColumnTranslator()
    }

    async list() {
        const data = await this.pool.query('SELECT table_name, column_name AS field, data_type, udt_name AS type FROM information_schema.columns WHERE table_schema = $1 ORDER BY table_name', ['public'])

        const tables = this.parseTableData(data.rows)
        return Object.entries(tables)
                     .map(([collectionName, rs]) => asWixSchema(rs.map( this.translateDbTypes.bind(this) ), collectionName))
    }

    async create(collectionName, _columns) {
        const columns = _columns || []
        const dbColumnsSql = [...this.systemFields, ...columns].map( c => this.sqlSchemaTranslator.columnToDbColumnSql(c) )
                                                               .join(', ')
        const primaryKeySql = this.systemFields.filter(f => f.isPrimary).map(f => escapeIdentifier(f.name)).join(', ')

        await this.pool.query(`CREATE TABLE IF NOT EXISTS ${escapeIdentifier(collectionName)} (${dbColumnsSql}, PRIMARY KEY (${primaryKeySql}))`)
                  .catch( translateErrorCodes )
    }

    async drop(collectionName) {
        await this.pool.query(`DROP TABLE IF EXISTS ${escapeIdentifier(collectionName)}`)
                  .catch( translateErrorCodes )
    }


    async addColumn(collectionName, column) {
        await validateSystemFields(column.name)

        await this.pool.query(`ALTER TABLE ${escapeIdentifier(collectionName)} ADD ${escapeIdentifier(column.name)} ${this.sqlSchemaTranslator.dbTypeFor(column)}`)
                  .catch( translateErrorCodes )
    }

    async removeColumn(collectionName, columnName) {
        await validateSystemFields(columnName)

        return await this.pool.query(`ALTER TABLE ${escapeIdentifier(collectionName)} DROP COLUMN ${escapeIdentifier(columnName)}`)
                         .catch( translateErrorCodes )
    }

    async describeCollection(collectionName) {
        const res = await this.pool.query('SELECT table_name, column_name AS field, data_type, udt_name AS type, character_maximum_length FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY table_name', ['public', collectionName])
                              .catch( translateErrorCodes )
        if (res.rows.length === 0) {
            throw new CollectionDoesNotExists('Collection does not exists')
        }
        return asWixSchema(res.rows.map( this.translateDbTypes.bind(this) ), collectionName)
    }


    translateDbTypes(row) {
        row.type = this.sqlSchemaTranslator.translateType(row.type)
        return row
    }

    parseTableData(rows) {
        return rows.reduce((o, r) => {
                                const arr = o[r.table_name] || []
                                arr.push(r)
                                o[r.table_name] = arr
                                return o
                            }, {})
    }
}

module.exports = SchemaProvider
