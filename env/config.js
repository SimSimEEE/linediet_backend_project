/**
 * Environment configuration loader
 */
const fs = require('fs');
const yaml = require('js-yaml');

const CONF = () => {
    const profile = process.env.ENV || 'dev';

    return {
        dev: {
            runtime: 'nodejs20.x',
            region: 'ap-northeast-2',
            env: 'dev.yml',
            securityGroupIds: [],
            subnetIds: [],
        },
        prod: {
            runtime: 'nodejs20.x',
            region: 'ap-northeast-2',
            env: 'prod.yml',
            securityGroupIds: [],
            subnetIds: [],
        },
    };
};

module.exports = { CONF };
