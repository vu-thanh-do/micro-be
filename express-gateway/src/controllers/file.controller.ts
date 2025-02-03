import { Request, Response } from "express";
import { httpClient } from "../utils/httpClient";
import { config } from "../config";

export const proxyServiceImages = async (req: Request, res: Response): Promise<any> => {
  try {
    const { filename } = req.params;
  
    const response = await httpClient({
      method: "GET",
      url: `${config.services.fileService}/images/${filename}`,
      responseType: "stream",
    });
    console.log(response)
    res.setHeader("Content-Type", response.headers["content-type"]);
    res.send(Buffer.from(response.data));
  } catch (error) {
    res.status(500).json({ message: "Error fetching image" });
  }
};
