const db = require("../models");
const { MANAGER } = require("../constant/role")
const verifyToken = require("../utils/jwt")

exampleMiddlewareFunction = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization ?? '';
    const token = authorization.split(' ')[1];
    if (!token || !authorization.startsWith('Bearer')) throw ({ name: 'Unauthorized' })

    const tokenData = verifyToken(token);
    const [results] = await db.sequelize.query(`Select * from users where id = ${tokenData.id};`, { type: db.sequelize.QueryTypes.SELECT })
    if (results.positionTitle != MANAGER) throw ({ name: 'Unauthorized' })

    req.userData = {
      id: tokenData.id,
      role: results.role,
    };

    next();
  } catch (error) {
    res.status(401).json(error)
  }
};

const verify = {
  exampleMiddlewareFunction: exampleMiddlewareFunction,
};

module.exports = verify;
