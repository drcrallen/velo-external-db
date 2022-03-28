const { List, ListHeaders, Create, Drop, AddColumn, RemoveColumn, Describe, BulkDelete, Truncate, DeleteImmediately, UpdateImmediately, Projection, StartWithCaseSensitive } = require('velo-external-db-commons').SchemaOperations

const supportedOperations =  [ List, ListHeaders, Create, Drop, AddColumn, RemoveColumn, Describe, BulkDelete, Truncate, DeleteImmediately, UpdateImmediately, Projection, StartWithCaseSensitive ]

module.exports = { supportedOperations }