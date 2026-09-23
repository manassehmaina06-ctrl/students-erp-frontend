module.exports = {
  draft:             { student:    ['submitted'] },
  submitted:         { admissions: ['pending_approval', 'rejected'], academic: ['pending_approval', 'rejected'] },
  pending_approval:  { admissions: ['approved', 'rejected'],         academic: ['approved', 'rejected'] },
  approved:          { finance:    ['finance_review'] },
  finance_review:    { finance:    ['payment_validated'] },
  payment_validated: { admissions: ['admitted', 'rejected'], academic: ['admitted', 'rejected'] },
  admitted:          { finance:    ['enrolled'] },
  rejected:          {},
  enrolled:          {},
};
