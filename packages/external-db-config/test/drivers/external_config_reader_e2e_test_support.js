const { Uninitialized } = require('test-commons')
const { create } = require('../../lib/factory')
const awsMySql = require('./aws_mysql_config_test_support')
const azureMySql = require('./azure_mysql_config_test_support')
const gcpMySql = require('./gcp_mysql_config_test_support')
const gcpSpanner = require('./gcp_spanner_config_test_support')

const env = {
    configReader: Uninitialized,
}

const initDriver = (vendor, engine) => {
    switch (vendor.toLowerCase()) {
        case 'aws':
            return awsMySql
        case 'azr':
            return azureMySql
        case 'gcp':
            if (engine === 'spanner') {
                return gcpSpanner
            }
            return gcpMySql

    }
}


const initEnv = (vendor, engine) => {
    process.env.CLOUD_VENDOR = vendor
    process.env.TYPE = engine

    env.configReader = create()
    env.driver = initDriver(vendor, engine)
}

const ExpectedProperties = ['CLOUD_VENDOR', 'TYPE']

const reset = () => {
    env.driver.reset()
    ExpectedProperties.forEach(p => delete process.env[p])
}

module.exports = { initEnv, reset, env,
}