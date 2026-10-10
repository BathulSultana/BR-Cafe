"""Tunable business rules. Change these without touching module code."""

# Commission each channel charges, as a fraction of the sale.
COMMISSION_RATES = {
    "swiggy": 0.22,
    "zomato": 0.20,
    "pos": 0.0,
    "website": 0.03,
}
DEFAULT_COMMISSION = 0.15

# Minutes promised to the customer from order placement.
DEFAULT_SLA_MINUTES = 30

# Rush-hour scheduler
STATIONS = 3                 # parallel cooking stations
RUSH_PENDING_THRESHOLD = 6   # open orders at or above this = rush mode
RUSH_WINDOW_MINUTES = 15     # orders placed within this window count toward the rush check
DEFAULT_PREP_MINUTES = 8.0   # used when an item has no prep time

WASTE_REASONS = {"spoilage", "overproduction", "prep_error", "returned", "expired", "other"}
