import dayjs from "dayjs"
import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { prisma } from "./lib/prisma"


export async function appRoutes(app: FastifyInstance) {
    
    app.post('/habits', async (request) => {
        const createHabitBody = z.object({
            title: z.string(),
            weekDays: z.array(
                z.number().min(0).max(6)
            )
        })

        const {title, weekDays} = createHabitBody.parse(request.body)

        const today = dayjs().startOf('day').toDate()

        await prisma.habit.create({
            data: {
                title,
                created_at: today,
                weekDays: {
                    create: weekDays.map(weekDay => {
                        return {
                            week_day: weekDay,
                        }
                    })
                }
            }
        })
    })

    app.get('/day', async (request) => {
        const getDayParams = z.object({
            date: z.coerce.date()
        })
        
        const { date } = getDayParams.parse(request.query)

        const parseDate = dayjs(date).startOf('day')
        const  weekDay = parseDate.get('day')

        // todos os hábitos possíveis
        const possbleHabits = await prisma.habit.findMany({
            where: {
                created_at: {
                    lte: date,
                },
                weekDays: {
                    some: {
                        week_day: weekDay,
                    }
                }
            }
        })


        // todos os hábitos já concluídos
        const day = await prisma.day.findUnique({
            where: {
                date: parseDate.toDate(),
            },
            include: {
                dayHabits: true
            }
        })

        const completedHabits =day?.dayHabits.map(dayHabit => {
            return dayHabit.habit_id
        })

        return {
            possbleHabits,
            completedHabits,
        }

    })

    app.post('/toggle', async (request) => {
        
    })

}

