import { Router, Request, Response } from "express";
import Express from "express";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { Brain, usermodel1, Link } from "../Db";
import ts from "typescript";
import { middleware } from "../middleware";
import { random } from "../utils";

const app = Express();
const JWT_SECRET = "process.env.JWT_SECRET";
const userrouter = Router();
//signup
userrouter.post("/signup", async (req: Request, res: Response) => {
    //zod schema
  const reqBody = z.object({
    email: z.string().min(3).max(50).email(),
    password: z
      .string()
      .min(6)
      .refine((password) => /[A-Z]/.test(password), {
        message: "Required at least one uppercase character",
      })
      .refine((password) => /[a-z]/.test(password), {
        message: "Required at least one lowercase character",
      })
      .refine((password) => /[0-9]/.test(password), {
        message: "Required at least one number",
      })
      .refine((password) => /[!@#$%^&*]/.test(password), {
        message: "Required at least one special character",
      }),
    name: z.string().min(3).max(30),
  });
  //parsing the request body and validating it against the schema
  const parsedData = reqBody.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect format",
      error: parsedData.error.issues[0].message,
    });
    return;
  }
  const { email, password, name } = parsedData.data;
  try {
    const user = await usermodel1.findOne({ email });
    if (user) {
      res.json({
        message: "User already exists",
      });
      return;
    }
    //hashing the password and saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new usermodel1({
      email,
      password: hashedPassword,
      name,
    });
    await newUser.save();
    res.json({
      message: "User created successfully",
    });
  } catch (error) {
    res.json({
      message: "Error creating user",
      error,
    });
  }
});

//signin
userrouter.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;
        //validate the email and password
        if(!email || !password){
            res.json({
                message: "Incorrect format",
                error: "Email and password are required"
            })
            return;
        }
        //check if user exists
        const user = await usermodel1.findOne({ email });
        if (!user) {
            res.json({
                message: "User not found",
            });
            return;
        }
        //check if password matches
        //@ts-ignore
        const isPasswordCorrect = await bcrypt.compare(password, user.password as string);
        if (!isPasswordCorrect) {
            res.json({
                message: "Incorrect password",
            });
            return;
        }
        //generate a token
        const token = await Jwt.sign({ email }, JWT_SECRET);
        res.json({
            message: "Login successful",
            token,
        });

    }catch(error){
        res.json({
            message: "Error",
            error
        })
        return;
    }
});

//add content
userrouter.post("/content", middleware, async (req: Request, res: Response) => {
    const { title, link, tag, type } = req.body;

    if (!title || !link || !tag || !type) {
        res.status(400).json({
            message: "Incorrect format",
            error: "Title, link, tag, and type are required",
        });
        return;
    }

    try {
        await Brain.create({
            title,
            link,
            tag,
            type,
            userId: req.userId,
        });

        res.status(201).json({
            message: "Content added successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Error adding content",
            error,
        });
    }
});


// get all content
userrouter.get("/content", middleware, async (req: Request, res: Response) => {
    try {
        const content = await Brain.find({ userId: req.userId });
        res.status(200).json({
            message: "Content fetched successfully",
            content,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching content",
            error,
        });
    }
});

//delete content
userrouter.delete("/content/:id", middleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await Brain.deleteOne({ _id: id, userId: req.userId });
        res.status(200).json({
            message: "Content deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting content",
            error,
        });
    }

});


//share brain to user
userrouter.post("/share", middleware, async (req: Request, res: Response) => {
  const share = req.body.share;
  if (share) {
          const existingLink = await Link.findOne({
              userId: req.userId
          });

          if (existingLink) {
              res.json({
                  hash: existingLink.hash
              })
              return;
          }
          const hash = random(10);
          await Link.create({
              userId: req.userId,
              hash: hash
          })

          res.json({
              hash
          })
  } else {
      await Link.deleteOne({
          userId: req.userId
      });

      res.json({
          message: "Removed link"
      })
  }
});

// get the shareed link

userrouter.get("/share/:hash",middleware, async(req: Request, res: Response) => {
    const { hash } = req.params;

    const link = await Link.findOne({ hash });
    if (!link) {
        res.status(404).json({
            message: "Link not found",
        });
        return;
    }

    //user Id
    const content = await Brain.findOne({ userId: link.userId });
    if (!content) {
        res.status(404).json({
            message: "Content not found",
        });
        return;
    } 

    const user = await usermodel1.findOne({ _id: link.userId });
    if (!user) {
        res.status(404).json({
            message: "User not found",
        });
        return;
    }

    res.status(200).json({
        message: "Link fetched successfully",
        content,
        user,
    });

});

export default userrouter;
