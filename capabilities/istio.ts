import { Capability, a } from "pepr";

export const Istio = new Capability({
  name: "istio",
  description: "Istio service mesh capability.",
  namespaces: [],
});

// Use the 'When' function to create a new Capability Action
const { When } = Istio;

// When(a.<Kind>).Is<Event>().Then(change => change.<changes>
When(a.Service)
  .IsCreated()
  .Then(svc => svc.SetLabel("pepr", "hi-istio"));
