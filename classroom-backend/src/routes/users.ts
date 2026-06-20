import express from "express";
import { and, desc, eq, ilike, or, sql, getTableColumns } from "drizzle-orm";

import { db } from "../db/index.js";
import {
  classes,
  departments,
  enrollments,
  subjects,
  user,
} from "../db/schema/index.js";

type UserRoles = "admin" | "teacher" | "student";

const router = express.Router();


// Get all users with optional search, role filter, and pagination
router.get("/", async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    if (search) {
      filterConditions.push(
        or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
      );
    }

    if (role) {
      filterConditions.push(eq(user.role, role as UserRoles));
    }

    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const usersList = await db
      .select()
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: usersList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user details with role-specific data
router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ data: userRecord });
  } catch (error) {
    console.error("GET /users/:id error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update a user (PATCH) — role, image, name
router.patch("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const { name, role: newRole, image, imageCldPubId } = req.body;

    const updatePayload: Partial<typeof user.$inferInsert> = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (newRole !== undefined) {
      const validRoles: UserRoles[] = ["student", "teacher", "admin"];
      if (!validRoles.includes(newRole)) {
        return res.status(400).json({ error: "Invalid role value" });
      }
      updatePayload.role = newRole;
    }
    if (image !== undefined) updatePayload.image = image;
    if (imageCldPubId !== undefined) updatePayload.imageCldPubId = imageCldPubId;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const [updatedUser] = await db
      .update(user)
      .set(updatePayload)
      .where(eq(user.id, userId))
      .returning({ id: user.id });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const [userDetails] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    res.status(200).json({ data: userDetails });
  } catch (error) {
    console.error("PATCH /users/:id error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete a user
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const [deletedUser] = await db
      .delete(user)
      .where(eq(user.id, userId))
      .returning({ id: user.id });

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ data: { id: deletedUser.id } });
  } catch (error) {
    console.error("DELETE /users/:id error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// List departments associated with a user
router.get("/:id/departments", async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 10 } = req.query;

    const [userRecord] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.id, userId));

    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userRecord.role !== "teacher" && userRecord.role !== "student") {
      return res.status(200).json({
        data: [],
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);
    const offset = (currentPage - 1) * limitPerPage;

    const countResult =
      userRecord.role === "teacher"
        ? await db
            .select({ count: sql<number>`count(distinct ${departments.id})` })
            .from(departments)
            .leftJoin(subjects, eq(subjects.departmentId, departments.id))
            .leftJoin(classes, eq(classes.subjectId, subjects.id))
            .where(eq(classes.teacherId, userId))
        : await db
            .select({ count: sql<number>`count(distinct ${departments.id})` })
            .from(departments)
            .leftJoin(subjects, eq(subjects.departmentId, departments.id))
            .leftJoin(classes, eq(classes.subjectId, subjects.id))
            .leftJoin(enrollments, eq(enrollments.classId, classes.id))
            .where(eq(enrollments.studentId, userId));

    const totalCount = countResult[0]?.count ?? 0;

    const departmentsList =
      userRecord.role === "teacher"
        ? await db
            .select({
              ...getTableColumns(departments),
            })
            .from(departments)
            .leftJoin(subjects, eq(subjects.departmentId, departments.id))
            .leftJoin(classes, eq(classes.subjectId, subjects.id))
            .where(eq(classes.teacherId, userId))
            .groupBy(
              departments.id,
              departments.code,
              departments.name,
              departments.description,
              departments.createdAt,
              departments.updatedAt
            )
            .orderBy(desc(departments.createdAt))
            .limit(limitPerPage)
            .offset(offset)
        : await db
            .select({
              ...getTableColumns(departments),
            })
            .from(departments)
            .leftJoin(subjects, eq(subjects.departmentId, departments.id))
            .leftJoin(classes, eq(classes.subjectId, subjects.id))
            .leftJoin(enrollments, eq(enrollments.classId, classes.id))
            .where(eq(enrollments.studentId, userId))
            .groupBy(
              departments.id,
              departments.code,
              departments.name,
              departments.description,
              departments.createdAt,
              departments.updatedAt
            )
            .orderBy(desc(departments.createdAt))
            .limit(limitPerPage)
            .offset(offset);

    res.status(200).json({
      data: departmentsList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /users/:id/departments error:", error);
    res.status(500).json({ error: "Failed to fetch user departments" });
  }
});

// List subjects associated with a user
router.get("/:id/subjects", async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 10 } = req.query;

    const [userRecord] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.id, userId));

    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userRecord.role !== "teacher" && userRecord.role !== "student") {
      return res.status(200).json({
        data: [],
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);
    const offset = (currentPage - 1) * limitPerPage;

    const countResult =
      userRecord.role === "teacher"
        ? await db
            .select({ count: sql<number>`count(distinct ${subjects.id})` })
            .from(subjects)
            .leftJoin(classes, eq(classes.subjectId, subjects.id))
            .where(eq(classes.teacherId, userId))
        : await db
            .select({ count: sql<number>`count(distinct ${subjects.id})` })
            .from(subjects)
            .leftJoin(classes, eq(classes.subjectId, subjects.id))
            .leftJoin(enrollments, eq(enrollments.classId, classes.id))
            .where(eq(enrollments.studentId, userId));

    const totalCount = countResult[0]?.count ?? 0;

    const subjectsList =
      userRecord.role === "teacher"
        ? await db
            .select({
              ...getTableColumns(subjects),
              department: {
                ...getTableColumns(departments),
              },
            })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .leftJoin(classes, eq(classes.subjectId, subjects.id))
            .where(eq(classes.teacherId, userId))
            .groupBy(
              subjects.id,
              subjects.departmentId,
              subjects.name,
              subjects.code,
              subjects.description,
              subjects.createdAt,
              subjects.updatedAt,
              departments.id,
              departments.code,
              departments.name,
              departments.description,
              departments.createdAt,
              departments.updatedAt
            )
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset)
        : await db
            .select({
              ...getTableColumns(subjects),
              department: {
                ...getTableColumns(departments),
              },
            })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .leftJoin(classes, eq(classes.subjectId, subjects.id))
            .leftJoin(enrollments, eq(enrollments.classId, classes.id))
            .where(eq(enrollments.studentId, userId))
            .groupBy(
              subjects.id,
              subjects.departmentId,
              subjects.name,
              subjects.code,
              subjects.description,
              subjects.createdAt,
              subjects.updatedAt,
              departments.id,
              departments.code,
              departments.name,
              departments.description,
              departments.createdAt,
              departments.updatedAt
            )
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset);

    res.status(200).json({
      data: subjectsList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /users/:id/subjects error:", error);
    res.status(500).json({ error: "Failed to fetch user subjects" });
  }
});

export default router;