import Image from 'next/image'

export function FeaturesSection() {
  const features = [
    {
      title: "Ask & Practice Questions",
      description:
        "Chat with Leoqui just like you would with a classmate or tutor. Ask anything, get clear explanations instantly, and follow up with tailored practice problems that sharpen understanding topic by topic.",
      image: "/student-asking-questions-with-colorful-background.jpg",
      imagePosition: "right",
      bgColor: "bg-gradient-to-br from-teal-400 to-blue-500",
    },
    {
      title: "A Homework Help Buddy",
      description:
        "Upload assignments or tricky questions and receive step-by-step guidance without giving away the answers. Leoqui breaks tasks into manageable steps so students stay engaged while learning how to solve problems on their own.",
      image: "/placeholder-j6y6w.png",
      imagePosition: "left",
      bgColor: "bg-gradient-to-br from-blue-400 to-[#714B90]",
    },
    {
      title: "Study Notes for revisions",
      description:
        "Turn classroom materials into polished summaries in seconds. Generate concise revision notes, highlight key formulas, and bookmark insights so exam prep feels organised instead of overwhelming.",
      image: "/student-taking-notes-at-computer-with-yellow-backg.jpg",
      imagePosition: "right",
      bgColor: "bg-gradient-to-br from-yellow-400 to-orange-500",
    },
    {
      title: "Flash Cards and many more",
      description:
        "Create interactive flash cards, mind maps, and study playlists tailored to each learner. Leoqui keeps revision fresh with smart spaced repetition and creative study formats that stick.",
      image: "/mobile-app-flashcards-interface.jpg",
      imagePosition: "left",
      bgColor: "bg-white",
    },
    {
      title: "Take Quiz to check progress",
      description:
        "Measure mastery with adaptive quizzes that adjust to confidence levels. Instantly see strengths, close knowledge gaps, and celebrate milestones as you advance through your learning journey.",
      image: "/student-taking-online-quiz-with-headphones.jpg",
      imagePosition: "right",
      bgColor: "bg-gradient-to-br from-green-400 to-teal-500",
    },
  ]

  return (
    <section className="w-full px-6 py-20 bg-[#FFFBF2]">
      <div className="max-w-6xl mx-auto space-y-20">
        {features.map((feature, index) => (
          <div key={index} className="grid md:grid-cols-2 gap-12 items-center">
            {feature.imagePosition === "left" ? (
              <>
                <div
                  className={`relative rounded-2xl overflow-hidden ${feature.bgColor} p-8 flex items-center justify-center`}
                >
                  <Image
                    src={feature.image || "/placeholder.svg"}
                    alt={feature.title}
                    width={400}
                    height={256}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6 text-balance">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6 text-balance">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
                <div
                  className={`relative rounded-2xl overflow-hidden ${feature.bgColor} p-8 flex items-center justify-center`}
                >
                  <Image
                    src={feature.image || "/placeholder.svg"}
                    alt={feature.title}
                    width={400}
                    height={256}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
