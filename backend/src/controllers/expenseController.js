const expenseService = require('../services/expenseService');

async function listExpenses(req, res, next) {
  try { res.json(await expenseService.listExpenses(req.query)); }
  catch (err) { next(err); }
}

async function createExpense(req, res, next) {
  try { res.status(201).json(await expenseService.createExpense(req.body)); }
  catch (err) { next(err); }
}

async function updateExpense(req, res, next) {
  try { res.json(await expenseService.updateExpense(req.params.id, req.body)); }
  catch (err) { next(err); }
}

async function deleteExpense(req, res, next) {
  try { res.json(await expenseService.deleteExpense(req.params.id)); }
  catch (err) { next(err); }
}

module.exports = { listExpenses, createExpense, updateExpense, deleteExpense };
