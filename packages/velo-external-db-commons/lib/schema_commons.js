const {CannotModifySystemField} = require('./errors')

const SystemFields = [
    {
        name: '_id', type: 'text', subtype: 'string', precision: '50', isPrimary: true
    },
    {
        name: '_createdDate', type: 'datetime', subtype: 'datetime'
    },
    {
        name: '_updatedDate', type: 'datetime', subtype: 'datetime'
    },
    {
        name: '_owner', type: 'text', subtype: 'string', precision: '50'
    }]


const asWixSchema = (res, collectionName, translateType) => {
    return {
        id: collectionName,
        displayName: collectionName,
        allowedOperations: [
            "get",
            "find",
            "count",
            "update",
            "insert",
            "remove"
        ],
        maxPageSize: 50,
        ttl: 3600,
        fields: res.reduce( (o, r) => Object.assign(o, { [r.field]: {
                displayName: r.field,
                type: translateType(r.type),
                queryOperators: [
                    "eq",
                    "lt",
                    "gt",
                    "hasSome",
                    "and",
                    "lte",
                    "gte",
                    "or",
                    "not",
                    "ne",
                    "startsWith",
                    "endsWith" // todo: customize this list according to type
                ]
            } }), {} )
    }
}

const validateSystemFields = (columnName) => {
    if (SystemFields.find(f => f.name === columnName)) {
        throw new CannotModifySystemField('Cannot modify system field')
    }
    return Promise.resolve()
}

module.exports = { SystemFields, asWixSchema, validateSystemFields }