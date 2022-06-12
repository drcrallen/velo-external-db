const { EmptySort } = require('@wix-velo/velo-external-db-commons')
const { when } = require('jest-when')
const { escapeId, validateLiteral, patchFieldName } = require('../../src/mssql_utils')

const filterParser = {
    transform: jest.fn(),
    parseFilter: jest.fn(),
    orderBy: jest.fn(),
    parseAggregation: jest.fn(),
    selectFieldsFor: jest.fn(),
}

const stubEmptyFilterAndSortFor = (filter, sort) => {
    stubEmptyFilterFor(filter)
    stubEmptyOrderByFor(sort)
}

const stubEmptyFilterFor = (filter) => {
    when(filterParser.transform).calledWith(filter)
                                .mockReturnValue({ filterExpr: '', parameters: {} })
}

const stubEmptyOrderByFor = (sort) => {
    when(filterParser.orderBy).calledWith(sort)
                              .mockReturnValue(EmptySort)
}

const givenOrderByFor = (column, sort) => {
    when(filterParser.orderBy).calledWith(sort)
                              .mockReturnValue({ sortExpr: `ORDER BY ${escapeId(column)} ASC` })
}


const givenFilterByIdWith = (id, filter) => {
    when(filterParser.transform).calledWith(filter)
                                .mockReturnValue({ filterExpr: `WHERE ${escapeId('_id')} = ${validateLiteral('_id')}`, parameters: { [patchFieldName('_id')]: id } })
}

const givenAggregateQueryWith = (having, numericColumns, columnAliases, groupByColumns, filter) => {
    const c = numericColumns.map(c => c.name)
    when(filterParser.parseAggregation).calledWith({ postFilteringStep: filter, processingStep: having })
                                       .mockReturnValue({
                                           fieldsStatement: `${groupByColumns.map( escapeId )}, MAX(${escapeId(c[0])}) AS ${escapeId(columnAliases[0])}, SUM(${escapeId(c[1])}) AS ${escapeId(columnAliases[1])}`,
                                           groupByColumns: groupByColumns,
                                           havingFilter: '',
                                           parameters: {},
                                       })
}

const givenAllFieldsProjectionFor = (projection) => 
    when(filterParser.selectFieldsFor).calledWith(projection)
                                      .mockReturnValue('*')

const givenProjectionExprFor = (projection) => 
    when(filterParser.selectFieldsFor).calledWith(projection)
                                      .mockReturnValue(projection.map(escapeId).join(', '))

const givenStartsWithFilterFor = (filter, column, value) =>
    when(filterParser.transform).calledWith(filter)
                                .mockReturnValue({ filterExpr: `WHERE ${escapeId(column)} LIKE ${validateLiteral(column)}`, parameters: { [patchFieldName(column)]: `${value}%` } })

const givenGreaterThenFilterFor = (filter, column, value) =>
    when(filterParser.transform).calledWith(filter)
                                .mockReturnValue({ filterExpr: `WHERE ${escapeId(column)} > ${validateLiteral(column)}`, parameters: { [patchFieldName(column)]: value } })    


const givenNotFilterQueryFor = (filter, column, value) =>
    when(filterParser.transform).calledWith(filter)
                                .mockReturnValue({ filterExpr: `WHERE NOT (${escapeId(column)} = ${validateLiteral(column)})`, parameters: { [patchFieldName(column)]: value } })

const givenMatchesFilterFor = (filter, column, value) =>
    when(filterParser.transform).calledWith(filter)
                                .mockReturnValue({ filterExpr: `WHERE LOWER(${escapeId(column)}) LIKE LOWER(${validateLiteral(column)})`, 
                                                   parameters: { 
                                                        [patchFieldName(column)]: 
                                                            value.split('-').map((v, i, array) => 
                                                            i === array.length-1 ? v: `${v}[ \t\n-]`)
                                                            .join('') 
                                                    } 
                                                })

const givenIncludeFilterForIdColumn = (filter, value) => 
    when(filterParser.transform).calledWith(filter)
                                .mockReturnValue({ filterExpr: `WHERE ${escapeId('_id')} IN (${validateLiteral('_id')})`, parameters: { [patchFieldName('_id')]: value } })

const reset = () => {
    filterParser.transform.mockClear()
    filterParser.orderBy.mockClear()
    filterParser.parseAggregation.mockClear()
    filterParser.parseFilter.mockClear()
    filterParser.selectFieldsFor.mockClear()
}

module.exports = { stubEmptyFilterAndSortFor, givenOrderByFor, stubEmptyOrderByFor,
                   stubEmptyFilterFor, givenFilterByIdWith, givenAggregateQueryWith,
                   givenAllFieldsProjectionFor, givenProjectionExprFor, givenStartsWithFilterFor,
                   givenGreaterThenFilterFor, givenNotFilterQueryFor, givenMatchesFilterFor, givenIncludeFilterForIdColumn,
                   filterParser, reset
}