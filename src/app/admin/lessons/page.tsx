// PATH: src/app/admin/lessons/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { PlayCircle, FolderOpen } from 'lucide-react'
import CreateModuleForm from '@/components/admin/CreateModuleForm'
import CreateLessonForm from '@/components/admin/CreateLessonForm'
import EditLessonModal from '@/components/admin/EditLessonModal'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Lesson Management' }

interface Props { searchParams: Promise<{ courseId?: string }> }

export default async function AdminLessonsPage({ searchParams }: Props) {
  const { courseId: searchCourseId } = await searchParams

  const courses = await prisma.course.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })

  const selectedCourseId = searchCourseId ?? courses[0]?.id

  const modules = selectedCourseId
    ? await prisma.module.findMany({
        where: { courseId: selectedCourseId },
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true, title: true, order: true,
              hasQuiz: true, hasAssignment: true,
              videoUrl: true, content: true,
            },
          },
        },
      })
    : []

  const allModules = modules.map(m => ({ id: m.id, title: m.title }))

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#424040]">Lesson Management</h1>
        <p className="text-[#8A8888] text-sm mt-1">
          Add modules and lessons to your courses.
        </p>
      </div>

      {/* Course selector */}
      {courses.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-[#8A8888] text-sm">
            No courses yet.{' '}
            <Link href="/admin/courses" className="text-[#8A70D6] font-semibold hover:underline">
              Create a course first →
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {courses.map(c => (
              <Link key={c.id}
                href={`/admin/lessons?courseId=${c.id}`}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  c.id === selectedCourseId
                    ? 'bg-[#8A70D6] text-white border-[#8A70D6]'
                    : 'border-[#E8E4F0] text-[#8A8888] hover:border-[#8A70D6] hover:text-[#8A70D6]'
                }`}>
                {c.title}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: forms */}
            <div className="space-y-5">
              {/* Create module */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <FolderOpen size={15} className="text-[#8A70D6]" />
                  <h2 className="font-bold text-[#424040] text-sm">New Module</h2>
                </div>
                {selectedCourseId && (
                  <CreateModuleForm courseId={selectedCourseId} />
                )}
              </div>

              {/* Create lesson */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <PlayCircle size={15} className="text-[#8A70D6]" />
                  <h2 className="font-bold text-[#424040] text-sm">New Lesson</h2>
                </div>
                <CreateLessonForm modules={allModules} />
              </div>
            </div>

            {/* Right: module/lesson tree */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#8A8888]">
                  {modules.length} module{modules.length !== 1 ? 's' : ''} ·{' '}
                  {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
                </p>
              </div>

              {modules.length === 0 ? (
                <div className="card text-center py-12">
                  <FolderOpen size={36} className="text-[#E9E3FF] mx-auto mb-3" />
                  <p className="text-[#8A8888] text-sm font-semibold">No modules yet</p>
                  <p className="text-[#8A8888] text-xs mt-1">
                    Create your first module using the form on the left.
                  </p>
                </div>
              ) : (
                modules.map((module, mi) => (
                  <div key={module.id} className="card">
                    {/* Module header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-[#8A70D6] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {mi + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#424040]">{module.title}</p>
                        <p className="text-xs text-[#8A8888]">
                          {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Lessons */}
                    <div className="space-y-2">
                      {module.lessons.map(lesson => (
                        <div key={lesson.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-[#F8F6FF] hover:bg-[#E9E3FF] transition-colors group">
                          <div className="w-6 h-6 rounded-md bg-white border border-[#E8E4F0] flex items-center justify-center shrink-0 text-[10px] font-bold text-[#8A8888]">
                            {lesson.order}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#424040] truncate">
                              {lesson.title}
                            </p>
                            <div className="flex gap-1.5 mt-0.5 flex-wrap">
                              {lesson.videoUrl && (
                                <span className="badge-purple text-[10px]">Video</span>
                              )}
                              {lesson.content && (
                                <span className="badge-gray text-[10px]">Content</span>
                              )}
                              {lesson.hasQuiz && (
                                <span className="badge-purple text-[10px]">Quiz</span>
                              )}
                              {lesson.hasAssignment && (
                                <span className="badge-gray text-[10px]">Assignment</span>
                              )}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <EditLessonModal lesson={lesson} />
                          </div>
                        </div>
                      ))}

                      {module.lessons.length === 0 && (
                        <p className="text-xs text-[#8A8888] text-center py-3">
                          No lessons yet — add one using the form.
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}