// Search medicine by name
app.get("/search/:name", (req,res)=>{
  const query = req.params.name;
  db.query(
    "SELECT * FROM medicines WHERE name LIKE ?",
    [`%${query}%`],
    (err,result)=>{
      if(err) res.status(500).json(err);
      else res.json(result);
    }
  );
});

// Low stock alert
app.get("/low-stock", (req,res)=>{
  db.query(
    "SELECT * FROM medicines WHERE quantity < 20 ORDER BY quantity ASC",
    (err,result)=>{
      if(err) res.status(500).json(err);
      else res.json(result);
    }
  );
});

// Filter by company
app.get("/company/:name", (req,res)=>{
  db.query(
    "SELECT * FROM medicines WHERE company=?",
    [req.params.name],
    (err,result)=>{
      if(err) res.status(500).json(err);
      else res.json(result);
    }
  );
});

// Analytics
app.get("/analytics", (req,res)=>{
  db.query(
    "SELECT COUNT(*) as totalMedicines, SUM(quantity) as totalStock FROM medicines",
    (err,result)=>{
      if(err) res.status(500).json(err);
      else res.json(result[0]);
    }
  );
});

// Generate Bill
app.post("/billing", (req, res) => {
  const items = req.body.items;
  
  if (!items || Object.keys(items).length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  // Calculate total
  let billTotal = 0;
  Object.values(items).forEach(item => {
    billTotal += item.price * item.quantity;
  });

  // Start transaction: create bill, then sales records, then update quantities
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: "Transaction error" });

    // 1. Create bill record
    db.query(
      "INSERT INTO bills (total_amount) VALUES (?)",
      [billTotal],
      (err, billResult) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: "Failed to create bill" });
          });
        }

        const billId = billResult.insertId;
        let processedItems = 0;

        // 2. For each item: create sales record and update quantity
        Object.entries(items).forEach(([medId, item]) => {
          const itemTotal = item.price * item.quantity;

          // Create sales record
          db.query(
            "INSERT INTO sales (medicine_id, qty, total) VALUES (?, ?, ?)",
            [medId, item.quantity, itemTotal],
            (err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ error: "Failed to create sales record" });
                });
              }

              // Update medicine quantity
              db.query(
                "UPDATE medicines SET quantity = quantity - ? WHERE id = ?",
                [item.quantity, medId],
                (err) => {
                  if (err) {
                    return db.rollback(() => {
                      res.status(500).json({ error: "Failed to update stock" });
                    });
                  }

                  processedItems++;

                  // If all items processed, commit transaction
                  if (processedItems === Object.keys(items).length) {
                    db.commit((err) => {
                      if (err) {
                        return db.rollback(() => {
                          res.status(500).json({ error: "Commit failed" });
                        });
                      }
                      res.json({
                        success: true,
                        billId: billId,
                        totalAmount: billTotal,
                        itemsCount: processedItems
                      });
                    });
                  }
                }
              );
            }
          );
        });
      }
    );
  });
});
