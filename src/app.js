import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import customerRoutes from "./routes/customer.route.js";
import orderRoutes from "./routes/orders.route.js";
import campaignRoutes from "./routes/campaigns.route.js";
import aiRoutes from "./routes/ai.routes.js";
import nlRoutes from "./routes/nl.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";


const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));


app.use(express.urlencoded({
  extended : true ,//objects ke andar objects ko allow karta hai
  limit : "16kb"
}));

app.use(express.static("public"));

app.use(cookieParser());


//routes dec

app.use("/api/v1/customers" , customerRoutes )
app.use("/api/v1/orders" , orderRoutes )
app.use("/api/v1/campaigns" , campaignRoutes )
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/nl", nlRoutes);
app.use("/api/v1/delivery", deliveryRoutes);




export default app;