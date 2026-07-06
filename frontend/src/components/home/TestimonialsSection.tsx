// Legacy component: previously showed fabricated testimonials with names and
// amounts. Neutralised to comply with Google review policies and IRDAI
// advertising rules — renders a plain "how we help" note only.

const TestimonialsSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
            How we help
          </span>
          <h2 className="text-3xl font-bold">Assistance and guidance across insurance categories.</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            We do not display individual customer reviews. We provide assistance and guidance — claim
            decisions are made solely by the respective insurance company or competent authority.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
