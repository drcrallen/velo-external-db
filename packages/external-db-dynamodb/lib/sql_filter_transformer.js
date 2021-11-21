const { InvalidQuery } = require('velo-external-db-commons').errors
const { isObject } = require('velo-external-db-commons')
const { EMPTY_FILTER } = require('./dynamo_utils')

class FilterParser {
    constructor() {
    }

    transform(filter) {
        const results = this.parseFilter(filter)

        if (results.length === 0) {
            return { EMPTY_FILTER }
        }

        return {
            filterExpr: results[0].filterExpr
        }
    }


    
    parseFilter(filter) {
        if (!filter || !isObject(filter)|| filter.operator === undefined) {
            return []
        }

        const fieldName = filter.fieldName 
        const value = filter.value

        
        switch (filter.operator) {
            case '$and':
            case '$or':
                const res = value.map( this.parseFilter.bind(this) )
                const op = filter.operator === '$and' ? ' AND ' : ' OR '
                return [{
                    filterExpr: {
                        FilterExpression: res.map(r => r[0].filterExpr.FilterExpression).join( op ),
                        ExpressionAttributeNames: Object.assign ({}, ...res.map(r=>r[0].filterExpr.ExpressionAttributeNames) ),
                        ExpressionAttributeValues: Object.assign({}, ...res.map(r=>r[0].filterExpr.ExpressionAttributeValues) )
                    }
                }]
            case '$not':
                const res2 = this.parseFilter( filter.value )
                return [{
                    filterExpr:{
                        FilterExpression: `NOT (${res2[0].filterExpr.FilterExpression})`,
                        ExpressionAttributeNames: res2[0].filterExpr.ExpressionAttributeNames,
                        ExpressionAttributeValues: res2[0].filterExpr.ExpressionAttributeValues
                    }
                }]
        }
        
        if (this.isSingleFieldOperator(filter.operator)) {
            return [{
                filterExpr: {
                    FilterExpression: `#${fieldName} ${this.veloOperatorToDynamoOperator(filter.operator)} :${fieldName}`,
                    ExpressionAttributeNames: {
                        [`#${fieldName}`]: fieldName
                    },
                    ExpressionAttributeValues: {
                        [`:${fieldName}`]: this.valueForOperator(value, filter.operator)
                    }
                }
            }]
        }

        if (this.isSingleFieldStringOperator(filter.operator)) {
            return [{
                filterExpr: {
                    FilterExpression: `${this.veloOperatorToDynamoOperator(filter.operator)} (#${fieldName}, :${fieldName})`,
                    ExpressionAttributeNames: {
                        [`#${fieldName}`] : fieldName
                    },
                    ExpressionAttributeValues: {
                        [`:${fieldName}`] : filter.value
                    }
                }
            }]
        }


        if (filter.operator === '$hasSome') {
            
            if (filter.operator === '$hasSome' && (value === undefined || value.length === 0))
                throw new InvalidQuery('$hasSome cannot have an empty list of arguments')

            const filterExpressionVariables = {...value}

            return [{
                filterExpr: {
                    FilterExpression: `#${fieldName} IN (${Object.keys(filterExpressionVariables).map(f => `:${f}`).join(', ')})`,
                    ExpressionAttributeNames: {
                        [`#${fieldName}`] : fieldName
                    },
                    ExpressionAttributeValues: {
                        ...filterExpressionVariables
                    }
                }
            }] 

        }

        return []
    }

    isSingleFieldOperator(operator) {
        return ['$ne', '$lt', '$lte', '$gt', '$gte', '$eq'].includes(operator)
    }

    isSingleFieldStringOperator(operator) {
        return ['$contains', '$startsWith', '$endsWith'].includes(operator)
    }

    valueForOperator(value, operator) {
        if (operator === '$hasSome' && (value === undefined || value.length === 0)) {
            throw new InvalidQuery('$hasSome cannot have an empty list of arguments')
        }
        if (operator === '$eq' && value === undefined) {
            return null
        }

        return value
    }

    veloOperatorToDynamoOperator(operator) {
        switch (operator) {
            case '$eq':
                return '='
            case '$ne':
                return '<>'
            case '$lt':
                return '<'
            case '$lte':
                return '<='
            case '$gt':
                return '>'
            case '$gte':
                return '>='
            case '$hasSome':
                return 'IN'
            case '$contains':
                return 'contains'
            case '$startsWith':
                return 'begins_with'
            case '$endsWith':
                //not exists maybe use contains and then locally
                break

        }
    }
}

module.exports = FilterParser