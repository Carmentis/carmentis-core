module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                exclude: [
                    'transform-exponentiation-operator'
                ]
            }
            ]
    ],
    "plugins": ["@babel/plugin-syntax-bigint"]

};

